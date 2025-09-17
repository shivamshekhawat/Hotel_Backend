const { sql } = require("../db");

// ✅ Create a new RoomControl
async function createRoomControl(data) {
  const { room_id, master_light, reading_light, master_curtain, master_window, light_mode } = data;

  if (!room_id) throw new Error("room_id is required");

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("master_light", sql.Bit, master_light ?? 0)
    .input("reading_light", sql.Bit, reading_light ?? 0)
    .input("master_curtain", sql.Bit, master_curtain ?? 0)
    .input("master_window", sql.Bit, master_window ?? 0)
    .input("light_mode", sql.NVarChar, light_mode || "Warm")
    .query(`
      INSERT INTO RoomControls 
        (room_id, master_light, reading_light, master_curtain, master_window, light_mode)
      OUTPUT inserted.*
      VALUES (@room_id, @master_light, @reading_light, @master_curtain, @master_window, @light_mode)
    `);

  return result.recordset[0];
}

// ✅ Get all RoomControls
async function getAllRoomControls() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM RoomControls");
  return result.recordset;
}

// ✅ Get RoomControl by control_id
async function getRoomControlById(control_id) {
  const request = new sql.Request();
  const result = await request
    .input("control_id", sql.Int, control_id)
    .query("SELECT * FROM RoomControls WHERE control_id=@control_id");
  return result.recordset[0] || null;
}

// ✅ Get RoomControl by room_id
async function getRoomControlByRoomId(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query("SELECT * FROM RoomControls WHERE room_id=@room_id");
  return result.recordset[0] || null;
}

// ✅ Update RoomControl by control_id
async function updateRoomControl(control_id, data) {
  const { master_light, reading_light, master_curtain, master_window, light_mode } = data;

  const request = new sql.Request();
  await request
    .input("control_id", sql.Int, control_id)
    .input("master_light", sql.Bit, master_light)
    .input("reading_light", sql.Bit, reading_light)
    .input("master_curtain", sql.Bit, master_curtain)
    .input("master_window", sql.Bit, master_window)
    .input("light_mode", sql.NVarChar, light_mode)
    .query(`
      UPDATE RoomControls
      SET master_light=@master_light,
          reading_light=@reading_light,
          master_curtain=@master_curtain,
          master_window=@master_window,
          light_mode=@light_mode
      WHERE control_id=@control_id
    `);

  return getRoomControlById(control_id);
}

// ✅ Update RoomControl by room_id
async function updateRoomControlByRoomId(room_id, data) {
  const { master_light, reading_light, master_curtain, master_window, light_mode } = data;

  const request = new sql.Request();
  await request
    .input("room_id", sql.Int, room_id)
    .input("master_light", sql.Bit, master_light)
    .input("reading_light", sql.Bit, reading_light)
    .input("master_curtain", sql.Bit, master_curtain)
    .input("master_window", sql.Bit, master_window)
    .input("light_mode", sql.NVarChar, light_mode)
    .query(`
      UPDATE RoomControls
      SET master_light=@master_light,
          reading_light=@reading_light,
          master_curtain=@master_curtain,
          master_window=@master_window,
          light_mode=@light_mode
      WHERE room_id=@room_id
    `);

  return getRoomControlByRoomId(room_id);
}

// ✅ Delete RoomControl by control_id
async function deleteRoomControl(control_id) {
  const request = new sql.Request();
  await request
    .input("control_id", sql.Int, control_id)
    .query("DELETE FROM RoomControls WHERE control_id=@control_id");
  return true;
}

module.exports = {
  createRoomControl,
  getAllRoomControls,
  getRoomControlById,
  getRoomControlByRoomId,
  updateRoomControl,
  updateRoomControlByRoomId,
  deleteRoomControl,
};
