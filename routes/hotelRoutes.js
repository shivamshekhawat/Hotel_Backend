const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");

// POST /signup with validation
router.post(
  "/signup",
  hotelController.validateHotel,
  hotelController.checkValidation,
  hotelController.createHotel
);
// GET /api/hotels
router.get("/", hotelController.getHotels);

module.exports = router;
