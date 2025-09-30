const adminModel = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
const TEMP_TOKEN_SECRET = process.env.TEMP_TOKEN_SECRET || "TEMP_TOKEN_SECRET";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10; // Increased to 30 minutes

// Helper function to get current time in UTC
function getCurrentUTCDate() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
}

// Helper function to add minutes to current time in UTC
function addMinutesToDate(minutes) {
  const date = getCurrentUTCDate();
  return new Date(date.getTime() + minutes * 60000);
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to admin's email
const sendOTP = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find admin by username
    const admin = await adminModel.findAdminByUsername(username);
    
    // Verify admin exists and check password (plain text comparison)
    if (!admin || password !== admin.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if admin is actually an admin
    if (admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Generate OTP and set expiry (30 minutes from now in UTC)
    const otp = generateOTP();
    const otpExpiry = addMinutesToDate(OTP_EXPIRY_MINUTES);
    
    console.log(`Generated OTP: ${otp}, Expires at: ${otpExpiry} (UTC)`);
    
    // Save OTP to database
    await adminModel.updateAdminOTP(admin.admin_id, otp, otpExpiry);

    // Generate temp token for OTP verification
    const tempToken = jwt.sign(
      { adminId: admin.admin_id },
      TEMP_TOKEN_SECRET,
      { expiresIn: `${OTP_EXPIRY_MINUTES}m` }
    );

    // Send OTP via email
    const mailOptions = {
      from: `"Hotel Admin" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Your Admin Login OTP',
      text: `Your OTP for admin login is: ${otp}\nThis OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Admin Login OTP</h2>
          <p>Hello ${admin.username},</p>
          <p>Your OTP for admin login is: <strong>${otp}</strong></p>
          <p>This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Hotel Admin Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent to admin email',
      tempToken
    });

  } catch (error) {
    console.error('Error in sendOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Verify OTP and generate auth token
const verifyOTP = async (req, res) => {
  try {
    const { otp, tempToken } = req.body;
    console.log('Received OTP verification request:', { otp, tempToken });

    // Input validation
    if (!otp || !tempToken) {
      console.log('Missing OTP or tempToken');
      return res.status(400).json({ 
        success: false, 
        message: 'OTP and temp token are required' 
      });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, TEMP_TOKEN_SECRET);
      console.log('Decoded temp token:', decoded);
    } catch (error) {
      console.error('Error verifying temp token:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired temp token' 
      });
    }

    const adminId = decoded.adminId;
    console.log('Admin ID from token:', adminId);

    // Find admin and verify OTP
    const admin = await adminModel.getAdminById(adminId);
    if (!admin) {
      console.error('Admin not found for ID:', adminId);
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    console.log('Admin found. Current OTP in DB:', admin.otp);
    console.log('OTP expiry in DB:', admin.otp_expiry);
    console.log('Current server time:', new Date());

    // Log OTP verification attempt details
    console.log('Verifying OTP...');
    console.log('Current server time (UTC):', getCurrentUTCDate());
    
    // First, check if OTP matches (without checking expiry)
    if (admin.otp !== otp) {
      console.log('OTP does not match. Expected:', admin.otp, 'Got:', otp);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
    
    // Then check if OTP is expired
    const currentTime = getCurrentUTCDate();
    const otpExpiry = new Date(admin.otp_expiry);
    console.log('OTP expiry time from DB (UTC):', otpExpiry);
    
    if (otpExpiry <= currentTime) {
      console.log('OTP has expired. Current time:', currentTime, 'OTP expiry:', otpExpiry);
      return res.status(401).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }
    
    console.log('OTP is valid and not expired.');

    // Clear used OTP
    await adminModel.clearAdminOTP(adminId);

    // Generate JWT token
    const authToken = jwt.sign(
      { 
        adminId: admin.admin_id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '10000000000000' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      authToken
    });

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
