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
    let username = null;
    
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    let adminId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log(`Extracted token: ${token}`);
      
      try {
        // Decode the JWT token to extract admin ID
        const decoded = jwt.decode(token);
        if (decoded && decoded.role === "admin") {
          adminId = decoded.userId;
          if(!adminId) {
            return res.status(400).json({ error: "Invalid Token" });
          }
          else{
            console.log(`Extracted admin ID: ${adminId}`);
            const { username } = await adminModel.getAdminById(adminId);
            req.body.access_token = await token;
            console.log('req.body.UserName', username);
            req.body.UserName = await username;
          
            console.log('req.body.UserName', req.body.UserName);
          }
        } else {
          console.log('Invelid Token');
        } 
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
      }
    } else {
      console.log('No Bearer token found in Authorization header');
    }

    // Check if hotel username already exists
    const existingHotel = await hotelModel.findHotelByUsername(username);
    if (existingHotel) {
      return res.status(400).json({ error: "Hotel with this username already exists" });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(Password, 10);

    // Save hotel
    const result = await hotelModel.createHotel({ ...req.body });
    console.log('result', result);

    res.status(201).json({ message: "Hotel created successfully", hotel: result.recordset[0]});
  } catch (err) {
    next(err); // pass to global error handler
  }
};

 
// Fetch All Hotels Controller
 
const getHotels = async (req, res, next) => {
  try {
    const result = await pool.request().query("SELECT * FROM Hotels");
    res.json(result.recordset);
  } catch (err) {
    next(err); // pass to global error handler
  }
};


// Export

module.exports = {
  validateHotel,
  checkValidation,
  createHotel,
  getHotels
};
