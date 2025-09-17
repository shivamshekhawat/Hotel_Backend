const roomTempModel = require("../models/roomTemperatureModel");

// Create RoomTemperature

const createRoomTemperature = async (req, res, next) => {
  try {
    const temp = await roomTempModel.createRoomTemperature(req.body);
    res.status(201).json(temp);
  } catch (err) {
    next(err);
  }
};


// Get all RoomTemperatures

const getRoomTemperatures = async (req, res, next) => {
  try {
    const temps = await roomTempModel.getAllRoomTemperatures();
    res.json(temps);
  } catch (err) {
    next(err);
  }
};


// Get RoomTemperature by room_id

const getRoomTemperatureByRoomId = async (req, res, next) => {
  try {
    const temp = await roomTempModel.getRoomTemperatureByRoomId(req.params.room_id);
    if (!temp) return res.status(404).json({ message: "RoomTemperature not found" });
    res.json(temp);
  } catch (err) {
    next(err);
  }
};


// Update RoomTemperature by room_id

const updateRoomTemperatureByRoomId = async (req, res, next) => {
  try {
    const room_id = req.params.room_id;
    const updated = await roomTempModel.updateRoomTemperatureByRoomId(room_id, req.body);
    if (!updated) return res.status(404).json({ message: "RoomTemperature not found" });
    res.json({ message: "RoomTemperature updated successfully", updated });
  } catch (err) {
    next(err);
  }
};


// Delete RoomTemperature by room_id

const deleteRoomTemperature = async (req, res, next) => {
  try {
    await roomTempModel.deleteRoomTemperatureByRoomId(req.params.room_id);
    res.json({ message: "RoomTemperature deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRoomTemperature,
  getRoomTemperatures,
  getRoomTemperatureByRoomId,
  updateRoomTemperatureByRoomId,
  deleteRoomTemperature,
};
