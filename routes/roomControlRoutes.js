const express = require("express");
const router = express.Router();
const roomControlController = require("../controllers/roomControlController");

// ✅ CRUD by room_id (put these first to avoid conflict with /:id)
router.get("/room/:room_id", roomControlController.getRoomControlByRoomId);
router.put("/room/:room_id", roomControlController.updateRoomControlByRoomId);

// ✅ CRUD by control_id
router.post("/", roomControlController.createRoomControl);
router.get("/", roomControlController.getRoomControls);
router.get("/:id", roomControlController.getRoomControlById);
router.put("/:id", roomControlController.updateRoomControlById);
router.delete("/:id", roomControlController.deleteRoomControl);

module.exports = router;
