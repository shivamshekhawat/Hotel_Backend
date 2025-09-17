const Room = require("../models/roomModel");
const { sql, poolConnect } = require("../db");

// ================== CREATE ROOM CONTROLLER ==================
exports.createRoom = async (req, res, next) => {
  try {
    const result = await Room.createRoom(req.body);

    // Handle duplicate
    if (result.error) {
      return res.status(409).json({ error: result.error });
    }
    // ✅ Single response
    res.status(201).json({ message: "Room created successfully with RoomTemperature & DND", room: result.data });

  } catch (error) {
    next(error);
  }
};


exports.LoginRoom = async (req, res, next) => {
  try {
    const result = await Room.loginRoom(req.body);
    if (!result) return res.status(404).json({ error: "Invalid credentials" });
    const token = generateToken({ room_id: result.room_id, hotel_id: result.hotel_id, role: "room" });
    await Room.updateToken(result.room_id, token);
    await Room.updateFcmToken(result.room_id, req.body.fcm_token);
    await Room.updateDeviceId(result.room_id, req.body.device_id);
  
    res.status(200).json({
      message: "Login successful",
      room_id: result.room_id,
      hotel_id: result.hotel_id,
      role: "room",
      token: token
    });
  } catch (error) {
    next(error);
  }
};

// ================== GET ROOMS BY HOTEL ==================
exports.getRoomsByHotel = async (req, res, next) => {
  try {
    const { hotel_id } = req.query;
    if (!hotel_id) return res.status(400).json({ error: "hotel_id is required" });

    const rooms = await Room.getRooms(hotel_id);
    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

// ================== GET ROOM BY ID ==================
exports.getRoomById = async (req, res, next) => {
  try {
    const room = await Room.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(room);
  } catch (error) {
    next(error);
  }
};

// ================== UPDATE ROOM ==================
exports.updateRoom = async (req, res, next) => {
  try {
    const updatedRoom = await Room.updateRoom(req.params.id, req.body);
    res.json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    next(error);
  }
};

// ================== DELETE ROOM ==================
exports.deleteRoom = async (req, res, next) => {
  try {
    const deleted = await Room.deleteRoom(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Room not found" });

    await poolConnect;
    const request = new sql.Request();
    await request.input("room_id", sql.Int, req.params.id).query("DELETE FROM RoomTemperature WHERE room_id=@room_id");
    await request.input("room_id", sql.Int, req.params.id).query("DELETE FROM DND WHERE room_id=@room_id");

    res.json({ message: "Room deleted successfully along with RoomTemperature & DND" });
  } catch (error) {
    next(error);
  }
};
