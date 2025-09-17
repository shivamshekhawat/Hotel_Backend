const hotelModel = require("../models/hotelModel");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { sql, pool } = require("../db");

 
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

  body("UserName")
    .trim()
    .notEmpty().withMessage("UserName is required"),

  body("Password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
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
    const { UserName, Password } = req.body;

    // Check if hotel username already exists
    const existingHotel = await hotelModel.findHotelByUsername(UserName);
    if (existingHotel) {
      return res.status(400).json({ error: "Hotel with this username already exists" });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(Password, 10);

    // Save hotel
    await hotelModel.createHotelWithHash({ ...req.body, Password: hashedPassword });

    res.status(201).json({ message: "Hotel created successfully" });
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
