const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');

// @route   POST /api/v1/admin/auth/send-otp
// @desc    Send OTP to admin's email
// @access  Public
router.post('/send-otp', adminAuthController.sendOTP);

// @route   POST /api/v1/admin/auth/verify-otp
// @desc    Verify OTP and generate auth token
// @access  Public
router.post('/verify-otp', adminAuthController.verifyOTP);

module.exports = router;
