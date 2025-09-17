const roomControlModel = require("../models/roomControlModel");

 
// Create RoomControl
 
const createRoomControl = async (req, res, next) => {
  try {
    const control = await roomControlModel.createRoomControl(req.body);
    res.status(201).json(control);
  } catch (err) {
    next(err);
  }
};

 
// Get all RoomControls
 
const getRoomControls = async (req, res, next) => {
  try {
    const controls = await roomControlModel.getAllRoomControls();
    res.json(controls);
  } catch (err) {
    next(err);
  }
};

 
// Get RoomControl by control_id
 
const getRoomControlById = async (req, res, next) => {
  try {
    const control = await roomControlModel.getRoomControlById(req.params.id);
    if (!control) return res.status(404).json({ message: "RoomControl not found" });
    res.json(control);
  } catch (err) {
    next(err);
  }
};

 
// Get RoomControl by room_id
 
const getRoomControlByRoomId = async (req, res, next) => {
  try {
    const control = await roomControlModel.getRoomControlByRoomId(req.params.room_id);
    if (!control) return res.status(404).json({ message: "RoomControl not found" });
    res.json(control);
  } catch (err) {
    next(err);
  }
};

 
// Update RoomControl by control_id

const updateRoomControlById = async (req, res, next) => {
  try {
    const updated = await roomControlModel.updateRoomControl(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "RoomControl not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};


// Update RoomControl by room_id

const updateRoomControlByRoomId = async (req, res, next) => {
  try {
    const updated = await roomControlModel.updateRoomControlByRoomId(req.params.room_id, req.body);
    if (!updated) return res.status(404).json({ message: "RoomControl not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};


// Delete RoomControl by control_id

const deleteRoomControl = async (req, res, next) => {
  try {
    await roomControlModel.deleteRoomControl(req.params.id);
    res.json({ message: "RoomControl deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Export

module.exports = {
  createRoomControl,
  getRoomControls,
  getRoomControlById,
  getRoomControlByRoomId,
  updateRoomControlById,
  updateRoomControlByRoomId,
  deleteRoomControl,
};
