const express = require("express");
const roomController = require("../controllers/roomController");
const {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} = require("../models/roomModel");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Get all rooms for this hotel
router.get("/", verifyToken, async (req, res) => {
  try {
    const rooms = await getRooms(req.hotel.hotel_id); // pass hotel_id from token
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room by ID
// router.get("/:id", verifyToken, async (req, res ) => {
//   try {
//     const room = await getRoomById(req.params.id);
//     if (!room || room.hotel_id !== req.hotel.hotel_id) {
//       return res.status(404).json({ message: "Room not found" });
//     }
//     res.json(room);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get room dashboard
router.get("/:id", verifyToken, async (req, res) => {
  try {
    await roomController.getRoomDashboard(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create room
router.post("/", verifyToken, async (req, res) => {
  try {
    // Override hotel_id with the one from token
    const room = await roomController.createRoom(req, res);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/login", async (req, res) => {
  try {
    const room = await roomController.loginRoom(req, res);
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update room
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const room = await roomController.getRoomById(req);
    if (!room || room.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ message: "Room not found" });
    }
    const updated = await updateRoom(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete room
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const room = await getRoomById(req.params.id);
    if (!room || room.hotel_id !== req.hotel.hotel_id) {
      return res.status(404).json({ message: "Room not found" });
    }
    await deleteRoom(req.params.id);
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
