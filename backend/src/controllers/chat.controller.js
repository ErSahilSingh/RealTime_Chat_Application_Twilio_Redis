const Message = require('../models/Message');
const redisService = require('../services/redis.service');

/**
 * @route   GET /api/chats/:userId
 * @desc    Get chat history with a user
 * @access  Private
 */
exports.getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id }
      ]
    })
      .sort({ timestamp: -1 }) // Latest first for pagination
      .skip(skip)
      .limit(parseInt(limit))
      .populate('from', 'name avatar')
      .populate('to', 'name avatar');

    // Clear unread count
    await redisService.clearUnread(req.user._id.toString(), userId);

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      page: parseInt(page),
      hasMore: messages.length === parseInt(limit)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/chats/unread
 * @desc    Get unread message counts
 * @access  Private
 */
exports.getUnreadCounts = async (req, res, next) => {
  try {
    // Get from Redis cache
    const unreadCounts = await redisService.getUnreadCounts(req.user._id.toString());

    res.json({
      success: true,
      unreadCounts
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/chats/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    next(error);
  }
};
