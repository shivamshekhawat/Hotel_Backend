const adminModel = require("../models/adminModel");
const nodemailer = require('nodemailer');
const hotelModel = require("../models/hotelModel");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const { generateToken } = require("../configuration/tokenGenerator");

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET"; // Ideally from env

// Configure nodemailer with better error handling
const transporter = nodemailer.createTransport({ 
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true if 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3'
  }
});


// Helper function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if admin exists with this email
    const admin = await adminModel.findAdminByEmail(email);
    if (!admin) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to database
    await adminModel.updateAdminOTP(admin.admin_id, otp);

    // Send email with OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. This OTP is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Here is your OTP:</p>
          <div style="background: #f4f4f4; padding: 10px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This OTP is valid for 5 minutes. If you didn't request this, please ignore this email.</p>
          <p>Thank you,<br>Your Hotel Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP has been sent to your email'
    });

  } catch (error) {
    console.error('Error in sendOTP:', error);
    
    // Check if it's an authentication error
    if (error.code === 'EAUTH' || error.message.includes('Missing credentials')) {
      return res.status(500).json({
        success: false,
        error: 'Email service authentication failed. Please check your email credentials in environment variables.',
        details: process.env.NODE_ENV === 'development' ? 'EMAIL_USER and EMAIL_PASS must be set in .env file with valid Gmail credentials' : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    // Trim and validate input
    const trimmedEmail = email.toString().trim();
    const trimmedOTP = otp.toString().trim();

    if (!trimmedEmail || !trimmedOTP) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP cannot be empty'
      });
    }

    // Find admin by email
    const admin = await adminModel.findAdminByEmail(trimmedEmail);
    if (!admin) {
      // Don't reveal if email exists for security
      return res.status(400).json({
        success: false,
        error: 'Invalid email or OTP'
      });
    }

    // Debug logs (remove in production)
    console.log('Verifying OTP for admin:', {
      adminId: admin.admin_id,
      storedOTP: admin.otp,
      receivedOTP: trimmedOTP,
      otpExpiry: admin.otp_expiry,
      currentTime: new Date()
    });

    // Check if OTP exists and is not expired
    if (!admin.otp) {
      return res.status(400).json({
        success: false,
        error: 'No OTP found for this account. Please request a new one.'
      });
    }

    // Check OTP expiration
    const currentTime = new Date();
    const otpExpiry = new Date(admin.otp_expiry);
    
    if (otpExpiry < currentTime) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Compare OTPs (case-sensitive exact match)
    if (admin.otp !== trimmedOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please check and try again.'
      });
    }

    // Clear the OTP after successful verification
    await adminModel.clearAdminOTP(admin.admin_id);

    // Generate a token for the admin
    const token = generateToken({
      admin_id: admin.admin_id,
      email: admin.email,
      role: admin.role || 'user'
    });

    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        admin_id: admin.admin_id,
        email: admin.email,
        token: token
      }
    });

  } catch (error) {
    console.error('Error in verifyOTP:', {
      error: error.message,
      stack: error.stack,
      request: {
        body: req.body,
        headers: req.headers
      }
    });
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while verifying OTP',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, new password and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Find admin by email
    const admin = await adminModel.findAdminByEmail(email);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email'
      });
    }

    // Update password
    await adminModel.updateAdminPassword(admin.admin_id, newPassword);

    // Clear OTP after successful password reset
    await adminModel.clearAdminOTP(admin.admin_id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidPostalCode = (code) => /^\d{5,6}$/.test(code); // 5-6 digit postal code
const isValidYear = (year) => /^\d{4}$/.test(year) && year >= 1800 && year <= new Date().getFullYear();
const isValidPhone = (phone) => /^\d{7,15}$/.test(phone); // 7-15 digits

// ---------------- Signup ----------------
const signup = async (req, res) => {
  try {
    const {
      Name,
      Logo_url,
      Established_year,
      Address,
      "Service care no.": ServiceCareNo,
      City,
      Country,
      Postal_code,
      UserName,
      Password,
    } = req.body;

    // Required fields list
    const requiredFields = {
      Name,
      Logo_url,
      Established_year,
      Address,
      "Service care no.": ServiceCareNo,
      City,
      Country,
      Postal_code,
      UserName,
      Password,
    };

    // 1️⃣ Check missing fields
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.toString().trim() === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required field(s): ${missingFields.join(", ")}` });
    }

    // 2️⃣ Validate content formats
    if (Name.length > 20) return res.status(400).json({ error: "Name too long (max 20 chars)" });
    if (!isValidURL(Logo_url)) return res.status(400).json({ error: "Logo_url must be a valid URL" });
    if (!isValidYear(Established_year)) return res.status(400).json({ error: "Established_year must be a valid 4-digit year" });
    if (Address.length > 50) return res.status(400).json({ error: "Address too long (max 50 chars)" });
    if (!isValidPhone(ServiceCareNo)) return res.status(400).json({ error: "Service care no. must be 7-15 digits" });
    if (City.length > 20) return res.status(400).json({ error: "City too long (max 20 chars)" });
    if (Country.length > 20) return res.status(400).json({ error: "Country too long (max 20 chars)" });
    if (!isValidPostalCode(Postal_code)) return res.status(400).json({ error: "Postal_code must be 5-6 digits" });
    if (UserName.length < 3 || UserName.length > 20) return res.status(400).json({ error: "UserName must be 3-20 chars" });
    if (Password.length < 6) return res.status(400).json({ error: "Password must be at least 6 chars" });

    // 3️⃣ Check if username already exists
    const existingHotel = await hotelModel.findHotelByUsername(UserName);
    if (existingHotel) {
      return res.status(400).json({ error: "Hotel with this username already exists" });
    }

    // 4️⃣ Hash password and create hotel
    const hotel = await hotelModel.createHotel(req.body);

    res.status(201).json({
      message: "Hotel registered successfully",
      hotel_id: hotel.hotel_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- Login ----------------
const login = async (req, res) => {
  try {
    const { email, password, session_id } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // First try to find in admin table
    console.log('Attempting to find admin with email:', email);
    let admin = await adminModel.findAdminByEmail(email);
    
    console.log('Admin found:', admin ? 'Yes' : 'No');
    if (admin) {
      console.log('Admin password from DB:', admin.password);
      console.log('Provided password:', password);
      // Admin login flow
      const storedPassword = admin.password || '';
      const inputPassword = password || '';
      
      // Compare passwords (plain text comparison as per current implementation)
      if (inputPassword !== storedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate and update token
      const token = generateToken({ 
        admin_id: admin.admin_id, 
        role: 'admin',
        session_id: session_id || null 
      });

      // Update admin token in database
      await adminModel.updateAdminToken(admin.admin_id, token);

      // Return success response for admin
      return res.json({
        message: "Admin login successful",
        admin_id: admin.admin_id,
        token,
        session_id: session_id || null,
        user: {
          id: admin.admin_id,
          email: admin.email,
          name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim(),
          role: 'admin'
        }
      });
    }

    // If not an admin, try hotel login
    let hotel = await hotelModel.findHotelByEmail(email);
    
    // If not found by email, try by username (for backward compatibility)
    if (!hotel) {
      hotel = await hotelModel.findHotelByUsername(email);
    }

    if (!hotel) {
      return res.status(404).json({ message: "No account found with this email or username" });
    }

    // Ensure both passwords are strings for comparison
    const storedPassword = hotel.password ? String(hotel.password) : '';
    const inputPassword = password ? String(password) : '';
    
    // Direct plain text password comparison
    const isMatch = (inputPassword === storedPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate and update token
    const token = generateToken({ 
      hotel_id: hotel.hotel_id, 
      role: 'hotel',
      session_id: session_id || null 
    });
    
    await hotelModel.updateToken(hotel.hotel_id, token);

    // Return success response for hotel
    res.json({
      message: "Login successful",
      hotel_id: hotel.hotel_id,
      token,
      session_id: session_id || null,
      user: {
        id: hotel.hotel_id,
        email: hotel.email || email,
        name: hotel.name,
        role: 'hotel'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'An error occurred during login',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};


module.exports = {
  signup,
  login,
  sendOTP,
  verifyOTP,
  resetPassword
};
