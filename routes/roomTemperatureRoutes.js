const express = require("express");
const router = express.Router();
const controller = require("../controllers/roomTemperatureController");

// ✅ Routes
router.post("/", controller.createRoomTemperature);             // Create
router.get("/", controller.getRoomTemperatures);                // Get all
router.get("/:room_id", controller.getRoomTemperatureByRoomId); // Get by room_id
router.put("/:room_id", controller.updateRoomTemperatureByRoomId); // Update by room_id
router.delete("/:room_id", controller.deleteRoomTemperature);   // Delete by room_id

module.exports = router;
