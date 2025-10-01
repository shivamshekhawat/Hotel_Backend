const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

// Existing routes
router.post("/", notificationController.createNotification);       // Create
router.get(["/", "/hotel/:hotelId"], verifyToken, notificationController.getAllNotifications);        // Get by ID
router.put("/:id", notificationController.updateNotification);     // Update
router.delete("/:id", notificationController.deleteNotification);  // Delete

// New send notification endpoint
router.post("/send", notificationController.sendNotification);     // Send notification

module.exports = router;
