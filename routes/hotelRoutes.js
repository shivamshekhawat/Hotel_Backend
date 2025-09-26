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

// GET all hotels
router.get("/", verifyToken, hotelController.getHotels);

// GET dashboard for a specific hotel

router.get("/dashboard/:hotelId", verifyToken, hotelController.getDashboard);


module.exports = router;
