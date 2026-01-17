const User = require('../models/User');
const { sendOTP } = require('../services/twilio.service');
const redisService = require('../services/redis.service');
const { generateToken } = require('../utils/jwt');

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to mobile number
 * @access  Public
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

    // Validate mobile number
    if (!mobileNumber || !/^\+?[1-9]\d{1,14}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number in E.164 format (e.g., +1234567890)'
      });
    }

    // Rate limiting: max 3 OTP requests per hour (skip in development)
    if (process.env.NODE_ENV !== 'development') {
      const canProceed = await redisService.checkRateLimit(
        mobileNumber,
        'send_otp',
        3,
        3600 // 1 hour
      );

      if (!canProceed) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again after an hour.'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(`🔐 Generated OTP for ${mobileNumber}: ${otp}`); // Log for development

    // Store in Redis (5 minutes expiry)
    await redisService.storeOTP(mobileNumber, otp);

    // Send via Twilio --- only in production skip this in development
    if (process.env.NODE_ENV !== 'development') {
      await sendOTP(mobileNumber, otp);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your mobile number',
      // Only include in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    next(error);
  }
};


exports.verifyOTP = async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    // Validate input
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both mobile number and OTP'
      });
    }

    // Verify OTP from Redis
    const result = await redisService.verifyOTP(mobileNumber, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Find or create user
    let user = await User.findOne({ mobileNumber });
    
    if (!user) {
      user = await User.create({
        mobileNumber,
        name: `User ${mobileNumber.slice(-4)}` // Default name with last 4 digits
      });
      console.log(`✅ New user created: ${user._id}`);
    } else {
      // Update last seen
      user.lastSeen = new Date();
      await user.save();
      console.log(`✅ Existing user logged in: ${user._id}`);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        avatar: user.avatar,
        lastSeen: user.lastSeen
      }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    next(error);
  }
};


exports.logout = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // Remove socket mapping and presence
    await redisService.removeSocket(userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout Error:', error);
    next(error);
  }
};
