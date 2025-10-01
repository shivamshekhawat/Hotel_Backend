const express = require("express");
const roomController = require("../controllers/roomController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Room login (no token required)
router.post("/login", roomController.loginRoom);

// Room dashboard - requires room ID
router.get("/dashboard/:id", roomController.getRoomDashboard);

// Room action
router.post("/action", roomController.roomAction);

// Get all rooms or rooms by hotel
// GET /api/rooms - gets all rooms
// GET /api/rooms/91 - gets rooms for hotel with ID 91
router.get(["/", "/:hotelId"], roomController.getRoomsByHotel);

// Get a single room by ID
// Example: /api/rooms/room/101  (101 is room_id)
router.get("/room/:id", roomController.getRoomById);

// Create a new room (requires admin token)
router.post("/", verifyToken, roomController.createRoom);

// Update a room (requires admin token)
router.put("/:id", verifyToken, roomController.updateRoom);

// Delete a room (requires admin token)
router.delete("/:id", verifyToken, roomController.deleteRoom);

router.post("/:roomNumber/greeting", roomController.updateRoomGreeting);
router.get("/:roomNumber/greeting", roomController.getRoomGreeting);


module.exports = router;
