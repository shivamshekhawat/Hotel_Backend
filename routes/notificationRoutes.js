
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.post("/", notificationController.createNotification);       // Create
router.get("/", notificationController.getAllNotifications);       // Get all
router.get("/:id", notificationController.getNotification);        // Get by ID
router.put("/:id", notificationController.updateNotification);     // Update
router.delete("/:id", notificationController.deleteNotification);  // Delete

module.exports = router;
