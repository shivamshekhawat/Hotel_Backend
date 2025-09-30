const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Signup route
router.post("/signup", authController.signup);

// Login route
router.post("/login", authController.login);

// Forgot password - Send OTP
router.post("/forgot-password", authController.sendOTP);

// Verify OTP
router.post("/verify-otp", authController.verifyOTP);

// Reset password
router.post("/reset-password", authController.resetPassword);

module.exports = router;
