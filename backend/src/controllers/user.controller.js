const User = require('../models/User');
const redisService = require('../services/redis.service');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        mobileNumber: req.user.mobileNumber,
        name: req.user.name,
        avatar: req.user.avatar,
        lastSeen: req.user.lastSeen
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/search
 * @desc    Search users by mobile number or name
 * @access  Private
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mobileNumber: { $regex: query } }
      ],
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('name mobileNumber avatar lastSeen')
    .limit(20);

    // Check online status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => ({
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        avatar: user.avatar,
        online: await redisService.isUserOnline(user._id.toString()),
        lastSeen: user.lastSeen
      }))
    );

    res.json({
      success: true,
      users: usersWithStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name mobileNumber avatar lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const online = await redisService.isUserOnline(user._id.toString());

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        avatar: user.avatar,
        online,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    next(error);
  }
};
