const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /signup with validation
router.post(
  "/signup",
  verifyToken,
  hotelController.validateHotel,
  hotelController.checkValidation,
  hotelController.createHotel
);
// GET /api/hotels
router.get("/", hotelController.getHotels);

module.exports = router;
