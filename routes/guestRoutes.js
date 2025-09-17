const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guestController");
const { verifyToken } = require("../middleware/authMiddleware");

// Add JWT middleware if required
router.post("/", verifyToken, guestController.createGuest);    // Create
router.get("/", verifyToken, guestController.getGuests);       // Get all
router.get("/:id", verifyToken, guestController.getGuest);     // Get by ID
router.put("/:id", verifyToken, guestController.updateGuest);  // Update
router.delete("/:id", verifyToken, guestController.deleteGuest); // Delete

module.exports = router;
