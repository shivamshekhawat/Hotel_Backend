const { sql } = require("../db");

// Helper: format Date as "YYYY-MM-DD HH:mm:ss"
function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
}

// ✅ Update DND by room_id (only update, no create)
async function updateDNDByRoomId(room_id, data) {
  const { is_active, updated_time } = data;

  if (!room_id) throw new Error("room_id is required");

  const formattedTime = updated_time
    ? formatDate(new Date(updated_time))
    : formatDate(new Date());

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("is_active", sql.Bit, is_active)
    .input("updated_time", sql.DateTime, new Date(formattedTime))
    .query(`
      UPDATE DoNotDisturb
      SET is_active=@is_active,
          updated_time=@updated_time
      OUTPUT inserted.*
      WHERE room_id=@room_id
    `);

  if (result.recordset.length === 0) {
    throw new Error("DND record for this room_id not found");
  }

  const dnd = result.recordset[0];
  dnd.updated_time = formattedTime;
  return dnd;
}

// ✅ Get DND by room_id
async function getDNDByRoomId(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query("SELECT * FROM DoNotDisturb WHERE room_id=@room_id");

  if (!result.recordset[0]) return null;

  const row = result.recordset[0];
  row.updated_time = formatDate(new Date(row.updated_time));
  return row;
}

module.exports = {
  updateDNDByRoomId,
  getDNDByRoomId,
};
