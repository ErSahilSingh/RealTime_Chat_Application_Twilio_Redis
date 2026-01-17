const express = require('express');
const { sendOTP, verifyOTP, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;
