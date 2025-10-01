const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create a new guest
router.post("/", verifyToken, guestController.createGuest);

// Get all guests (basic info only)
router.get("/", verifyToken, guestController.getGuests);

// Get all guests with their room information
router.get("/with-rooms", verifyToken, guestController.getGuestsWithRooms);

// Get a single guest by ID
router.get("/:id", verifyToken, guestController.getGuest);

// Update a guest
router.put("/:id", verifyToken, guestController.updateGuest);

// Delete a guest
router.delete("/:id", verifyToken, guestController.deleteGuest);

module.exports = router;
