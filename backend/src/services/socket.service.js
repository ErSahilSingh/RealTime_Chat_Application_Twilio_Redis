const Message = require('../models/Message');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const redisService = require('./redis.service');
const { redisPub, redisSub } = require('../config/redis');

/**
 * Setup private chat event handlers
 */
exports.setupPrivateChat = (io, socket) => {
  
  // Handle private messages
  socket.on('private_message', async (data) => {
    try {
      const { to, text } = data;

      if (!text || !to) {
        return socket.emit('error', { message: 'Invalid message data' });
      }

      // Rate limiting: 20 messages per minute
      const canSend = await redisService.checkRateLimit(
        socket.userId,
        'send_message',
        20,
        60
      );

      if (!canSend) {
        return socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      }

      // Save message to MongoDB
      const message = await Message.create({
        from: socket.userId,
        to,
        text,
        timestamp: new Date(),
        delivered: false
      });

      // Populate sender info
      await message.populate('from', 'name avatar');

      const messageData = {
        id: message._id,
        from: message.from,
        to: message.to,
        text: message.text,
        timestamp: message.timestamp
      };

      // Get recipient's socket ID from Redis
      const recipientSocketId = await redisService.getSocket(to);

      if (recipientSocketId) {
        // Recipient is online, deliver immediately
        io.to(recipientSocketId).emit('receive_message', messageData);

        // Mark as delivered
        message.delivered = true;
        await message.save();

        // Send delivery confirmation to sender
        socket.emit('message_delivered', { messageId: message._id });
      } else {
        // Recipient is offline, increment unread count
        await redisService.incrementUnread(to, socket.userId);
        
        // Message will be fetched when they come online
        socket.emit('message_sent', { messageId: message._id, delivered: false });
      }

      console.log(`📧 Message from ${socket.userId} to ${to}: delivered=${message.delivered}`);

    } catch (error) {
      console.error('Private message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('message_read', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findByIdAndUpdate(
        messageId,
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (message) {
        // Notify sender about read receipt
        const senderSocketId = await redisService.getSocket(message.from.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message_read_receipt', {
            messageId,
            readBy: socket.userId,
            readAt: message.readAt
          });
        }
      }

    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
};

/**
 * Setup typing indicator
 */
exports.setupTypingIndicator = (io, socket) => {
  socket.on('typing', async (data) => {
    try {
      const { to, isTyping } = data;

      const recipientSocketId = await redisService.getSocket(to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing_status', {
          userId: socket.userId,
          isTyping
        });
      }

    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  });
};

/**
 * Setup group chat event handlers
 */
exports.setupGroupChat = (io, socket) => {
  
  // Join user's groups on connection
  socket.on('join_my_groups', async () => {
    try {
      const groups = await Group.find({ members: socket.userId });
      
      groups.forEach(group => {
        const roomName = `group:${group._id}`;
        socket.join(roomName);
        redisService.addToGroupRoom(group._id.toString(), socket.userId);
      });

      console.log(`👥 User ${socket.userId} joined ${groups.length} groups`);

    } catch (error) {
      console.error('Join groups error:', error);
    }
  });

  // Join specific group
  socket.on('join_group', async (data) => {
    try {
      const { groupId } = data;

      // Verify user is member
      const group = await Group.findById(groupId);
      if (!group || !group.members.some(m => m.toString() === socket.userId)) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }

      const roomName = `group:${groupId}`;
      socket.join(roomName);
      await redisService.addToGroupRoom(groupId, socket.userId);

      console.log(`👥 User ${socket.userId} joined group ${groupId}`);

    } catch (error) {
      console.error('Join group error:', error);
    }
  });

  // Send group message
  socket.on('group_message', async (data) => {
    try {
      const { groupId, text } = data;

      if (!text || !groupId) {
        return socket.emit('error', { message: 'Invalid message data' });
      }

      // Rate limiting
      const canSend = await redisService.checkRateLimit(
        socket.userId,
        'group_message',
        30,
        60
      );

      if (!canSend) {
        return socket.emit('error', { message: 'Rate limit exceeded' });
      }

      // Verify user is member
      const group = await Group.findById(groupId);
      if (!group || !group.members.some(m => m.toString() === socket.userId)) {
        return socket.emit('error', { message: 'Not a member of this group' });
      }

      // Save to MongoDB
      const message = await GroupMessage.create({
        groupId,
        from: socket.userId,
        text,
        timestamp: new Date(),
        readBy: [socket.userId] // Sender has read it
      });

      await message.populate('from', 'name avatar');

      const messageData = {
        id: message._id,
        groupId,
        from: message.from,
        text: message.text,
        timestamp: message.timestamp
      };

      // Publish to Redis Pub/Sub for horizontal scaling
      await redisPub.publish(
        `group:${groupId}`,
        JSON.stringify(messageData)
      );

      console.log(`📢 Group message in ${groupId} from ${socket.userId}`);

    } catch (error) {
      console.error('Group message error:', error);
      socket.emit('error', { message: 'Failed to send group message' });
    }
  });

  // Leave group
  socket.on('leave_group', async (data) => {
    try {
      const { groupId } = data;

      await Group.updateOne(
        { _id: groupId },
        { 
          $pull: { 
            members: socket.userId,
            admins: socket.userId
          }
        }
      );

      const roomName = `group:${groupId}`;
      socket.leave(roomName);
      await redisService.removeFromGroupRoom(groupId, socket.userId);

      // Notify other members
      io.to(roomName).emit('member_left', {
        groupId,
        userId: socket.userId
      });

      console.log(`👋 User ${socket.userId} left group ${groupId}`);

    } catch (error) {
      console.error('Leave group error:', error);
    }
  });

  // Mark group message as read
  socket.on('group_message_read', async (data) => {
    try {
      const { messageId } = data;

      await GroupMessage.updateOne(
        { _id: messageId },
        { $addToSet: { readBy: socket.userId } }
      );

    } catch (error) {
      console.error('Group message read error:', error);
    }
  });
};

/**
 * Subscribe to group messages via Redis Pub/Sub
 * This enables horizontal scaling - messages published from one server
 * instance are received by all server instances
 */
exports.subscribeToGroupMessages = (io) => {
  redisSub.psubscribe('group:*');

  redisSub.on('pmessage', (pattern, channel, message) => {
    try {
      const data = JSON.parse(message);
      
      // Emit to all sockets in this room on this server instance
      io.to(channel).emit('group_message_received', data);
      
    } catch (error) {
      console.error('Pub/Sub message error:', error);
    }
  });

  console.log('✅ Subscribed to group message channels');
};
