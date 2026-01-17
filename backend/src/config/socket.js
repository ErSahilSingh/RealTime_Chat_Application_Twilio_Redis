const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisService = require('../services/redis.service');
const socketService = require('../services/socket.service');

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    console.log(`✅ Socket connected: ${socket.id}, User: ${socket.userId}`);

    try {
      // Map socket to user in Redis
      await redisService.mapSocket(socket.userId, socket.id);
      
      // Set user online
      await redisService.setUserOnline(socket.userId);

      // Join user's personal room (for direct socket targeting)
      socket.join(socket.userId);

      // Broadcast to all users that this user is online
      socket.broadcast.emit('user_online', { userId: socket.userId });

      // Send connection confirmation to client
      socket.emit('connected', { userId: socket.userId });

      // Set up heartbeat to maintain presence
      const heartbeatInterval = setInterval(async () => {
        await redisService.setUserOnline(socket.userId);
      }, 10000); // Every 10 seconds

      // Setup event handlers
      socketService.setupPrivateChat(io, socket);
      socketService.setupGroupChat(io, socket);
      socketService.setupTypingIndicator(io, socket);

      // Disconnect handler
      socket.on('disconnect', async (reason) => {
        console.log(`❌ Socket disconnected: ${socket.id}, User: ${socket.userId}, Reason: ${reason}`);
        
        // Clear heartbeat interval
        clearInterval(heartbeatInterval);

        // Remove socket mapping
        await redisService.removeSocket(socket.userId);
        
        // Note: user:online key will auto-expire in 30 seconds if no reconnection

        // Broadcast to all users that this user is offline
        socket.broadcast.emit('user_offline', { userId: socket.userId });
      });

      // Error handler
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });

      // Logging for debugging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        socket.onAny((event, ...args) => {
          console.log(`📨 Event '${event}' from user ${socket.userId}:`, args);
        });
      }

    } catch (error) {
      console.error('Connection setup error:', error);
      socket.disconnect();
    }
  });

  // Subscribe to group message channels (Redis Pub/Sub)
  socketService.subscribeToGroupMessages(io);

  console.log('✅ Socket.IO server initialized');
  
  return io;
};

module.exports = initializeSocket;
