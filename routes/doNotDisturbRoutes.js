const express = require("express");
const router = express.Router();
const dndController = require("../controllers/doNotDisturbController");
const { verifyToken } = require("../middleware/authMiddleware");

// Update DND by room_id (body)
router.put("/", verifyToken, dndController.updateDNDByRoomId);

// Get DND by room_id (URL param)
router.get("/:room_id", verifyToken, dndController.getDNDByRoomId);


module.exports = router;
