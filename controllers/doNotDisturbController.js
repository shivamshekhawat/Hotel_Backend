const dndModel = require("../models/doNotDisturbModel");

// ✅ Get DND by room_id (using URL param)
const getDNDByRoomId = async (req, res) => {
  try {
    const room_id = req.params.room_id; // use URL param
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    const record = await dndModel.getDNDByRoomId(room_id);
    if (!record) return res.status(404).json({ message: "DND not found" });

    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Update DND by room_id (body param)
const updateDNDByRoomId = async (req, res) => {
  try {
    const { room_id } = req.body;
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    const updated = await dndModel.updateDNDByRoomId(room_id, req.body);
    if (!updated) return res.status(404).json({ message: "DND not found for update" });

    res.json({ message: "DND updated successfully", updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Optional: Create DND for a room
const createDND = async (req, res) => {
  try {
    const { room_id, is_active } = req.body;
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    const created = await dndModel.createDND({ room_id, is_active });
    res.status(201).json({ message: "DND created successfully", created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Optional: Delete DND by room_id
const deleteDNDByRoomId = async (req, res) => {
  try {
    const room_id = req.params.room_id;
    if (!room_id) return res.status(400).json({ error: "room_id is required" });

    await dndModel.deleteDNDByRoomId(room_id);
    res.json({ message: "DND deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDNDByRoomId,
  updateDNDByRoomId,
  createDND,
  deleteDNDByRoomId,
};
