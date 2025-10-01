const hotelModel = require("../models/hotelModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { sql, pool } = require("../db");
const adminModel = require("../models/adminModel");
const jwt = require("jsonwebtoken");

// Validation rules for hotel signup
const validateHotel = [
  body("Name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

  body("Logo_url")
    .optional()
    .isURL().withMessage("Logo_url must be a valid URL"),

  body("Established_year")
    .notEmpty().withMessage("Established_year is required")
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Established_year must be between 1800 and ${new Date().getFullYear()}`),

  body("Address")
    .trim()
    .notEmpty().withMessage("Address is required")
    .isLength({ min: 5 }).withMessage("Address must be at least 5 characters"),

  body("Service_care_no")
    .trim()
    .notEmpty().withMessage("Service care number is required")
    .matches(/^[0-9]{7,15}$/).withMessage("Service care number must be 7-15 digits"),

  body("City")
    .trim()
    .notEmpty().withMessage("City is required")
    .isLength({ min: 2 }),

  body("Country")
    .trim()
    .notEmpty().withMessage("Country is required")
    .isLength({ min: 2 }),

  body("Postal_code")
    .trim()
    .notEmpty().withMessage("Postal_code is required"),
];

// Middleware to handle validation errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Signup Controller
const createHotel = async (req, res, next) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    let adminId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log(`Extracted token: ${token}`);
      
      try {
        // Decode the JWT token to extract admin ID
        const decoded = jwt.decode(token);
        if (decoded && decoded.role === "admin") {
          adminId = decoded.userId || decoded.adminId;
          if (!adminId) {
            return res.status(400).json({ error: "Invalid Token - Missing admin ID" });
          }
          
          console.log(`Extracted admin ID: ${adminId}`);
          const admin = await adminModel.getAdminById(adminId);
          if (!admin) {
            return res.status(404).json({ error: "Admin not found" });
          }
          
          // Check if admin already has a hotel
          const hasHotel = await hotelModel.adminHasHotel(admin.username);
          if (hasHotel) {
            return res.status(400).json({ 
              error: "Admin already has a hotel. Only one hotel per admin is allowed." 
            });
          }
          
          req.body.access_token = token;
          req.body.UserName = admin.username;
          console.log('Admin username set:', req.body.UserName);
          
          // Save hotel
          const result = await hotelModel.createHotel({ ...req.body });
          console.log('Hotel creation result:', result);
          
          return res.status(201).json({ 
            message: "Hotel created successfully", 
            hotel: result.recordset[0] 
          });
          
        } else {
          console.log('Invalid token - missing or incorrect role');
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      } catch (decodeError) {
        console.error('Error processing token:', decodeError);
        return res.status(401).json({ error: "Invalid token" });
      }
    } else {
      console.log('No Bearer token found in Authorization header');
      return res.status(401).json({ error: "Authorization token required" });
    }
  } catch (err) {
    console.error('Error in createHotel:', err);
    next(err);
  }
};

// Fetch All Hotels Controller
const getHotels = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    const token = authHeader.substring(7);
    console.log(`Extracted token: ${token}`);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (!decoded || decoded.role !== "admin") {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }
      
      const hotels = await hotelModel.getAllHotels();
      
      if (!hotels || hotels.length === 0) {
        return res.status(404).json({ message: "No hotels found" });
      }
      
      return res.status(200).json(hotels);
      
    } catch (err) {
      console.error('Token verification failed:', err);
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: "Invalid token" });
      } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: "Token expired" });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error in getHotels:', err);
    next(err);
  }
};

// Dashboard API
const getDashboard = async (req, res, next) => {
  const { hotelId } = req.params;

  const hotelIdNum = parseInt(hotelId, 10);
  if (isNaN(hotelIdNum) || hotelIdNum <= 0) {
    return res.status(400).json({
      error: "Invalid hotelId parameter. Must be a positive integer."
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (!decoded || decoded.role !== "admin") {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Failed to verify token" });
  }

  try {
    const data = await hotelModel.getDashboardData(hotelIdNum);
    if (!data) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Internal server error", details: err.message });
  }
};

module.exports = {
  validateHotel,
  checkValidation,
  createHotel,
  getDashboard,
  getHotels
};
