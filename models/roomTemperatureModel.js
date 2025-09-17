const { sql } = require("../db");

// ✅ Utility: Format date to "YYYY-MM-DD HH:mm:ss"
function formatDateTime(date) {
  if (!date) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// ✅ Create a new RoomTemperature
async function createRoomTemperature(data) {
  const { room_id, current_temp, set_temp, updated_time } = data;
  if (!room_id) throw new Error("room_id is required");

  const formattedTime = updated_time ? new Date(updated_time) : new Date();

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("current_temp", sql.Int, current_temp ?? 25)
    .input("set_temp", sql.Int, set_temp ?? 25)
    .input("updated_time", sql.DateTime, formattedTime)
    .query(`
      INSERT INTO RoomTemperature (room_id, current_temp, set_temp, updated_time)
      OUTPUT inserted.*
      VALUES (@room_id, @current_temp, @set_temp, @updated_time)
    `);

  const temp = result.recordset[0];
  temp.updated_time = formatDateTime(new Date(temp.updated_time));
  return temp;
}

// ✅ Get all RoomTemperatures
async function getAllRoomTemperatures() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM RoomTemperature");
  return result.recordset.map((t) => ({
    ...t,
    updated_time: t.updated_time ? formatDateTime(new Date(t.updated_time)) : null,
  }));
}

// ✅ Get RoomTemperature by room_id
async function getRoomTemperatureByRoomId(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query("SELECT * FROM RoomTemperature WHERE room_id=@room_id");

  if (!result.recordset[0]) return null;

  const temp = result.recordset[0];
  temp.updated_time = temp.updated_time ? formatDateTime(new Date(temp.updated_time)) : null;
  return temp;
}

// ✅ Update RoomTemperature by room_id
async function updateRoomTemperatureByRoomId(room_id, data) {
  const { current_temp, set_temp, updated_time } = data;
  if (!room_id) throw new Error("room_id is required");

  const formattedTime = updated_time ? new Date(updated_time) : new Date();

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("current_temp", sql.Int, current_temp)
    .input("set_temp", sql.Int, set_temp)
    .input("updated_time", sql.DateTime, formattedTime)
    .query(`
      UPDATE RoomTemperature
      SET current_temp=@current_temp,
          set_temp=@set_temp,
          updated_time=@updated_time
      OUTPUT inserted.*
      WHERE room_id=@room_id
    `);

  if (result.recordset.length === 0) {
    throw new Error("RoomTemperature for this room_id not found");
  }

  const temp = result.recordset[0];
  temp.updated_time = formatDateTime(new Date(temp.updated_time));
  return temp;
}

// ✅ Delete RoomTemperature by room_id
async function deleteRoomTemperatureByRoomId(room_id) {
  const request = new sql.Request();
  return await request
    .input("room_id", sql.Int, room_id)
    .query("DELETE FROM RoomTemperature WHERE room_id=@room_id");
}

module.exports = {
  createRoomTemperature,
  getAllRoomTemperatures,
  getRoomTemperatureByRoomId,
  updateRoomTemperatureByRoomId,
  deleteRoomTemperatureByRoomId,
};
