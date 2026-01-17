const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    req.user = await User.findById(decoded.userId).select('-__v');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};
