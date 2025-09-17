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

    // Insert default RoomTemperature & DND
    await poolConnect;
    const request = new sql.Request();
    await request.input("room_id", sql.Int, result.data.room_id)
      .query(`INSERT INTO RoomTemperature (room_id, temperature, create_date, update_date) 
              VALUES (@room_id, 24.0, GETDATE(), GETDATE())`);
    await request.input("room_id", sql.Int, result.data.room_id)
      .query(`INSERT INTO DND (room_id, is_active, create_date, update_date) 
              VALUES (@room_id, 0, GETDATE(), GETDATE())`);

    // ✅ Single response
    res.status(201).json({ message: "Room created successfully with RoomTemperature & DND", room: result.data });

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
