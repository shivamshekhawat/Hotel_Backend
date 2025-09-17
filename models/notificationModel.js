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

// Create a new notification
async function createNotification(data) {
  const { room_id, message, type, created_time, is_read } = data;

  if (!room_id || !message || !type) {
    throw new Error("room_id, message, and type are required");
  }

  const formattedTime = created_time
    ? formatDate(new Date(created_time))
    : formatDate(new Date());

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("message", sql.NVarChar, message)
    .input("type", sql.NVarChar, type)
    .input("created_time", sql.DateTime, new Date(formattedTime))
    .input("is_read", sql.Bit, is_read ?? 0)
    .query(`
      INSERT INTO Notifications (room_id, message, type, created_time, is_read)
      OUTPUT inserted.*
      VALUES (@room_id, @message, @type, @created_time, @is_read)
    `);

  return result.recordset[0];
}

// Get all notifications
async function getAllNotifications() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM Notifications");

  return result.recordset.map((row) => ({
    ...row,
    created_time: formatDate(new Date(row.created_time)),
  }));
}

// Get notification by ID
async function getNotificationById(notification_id) {
  const request = new sql.Request();
  const result = await request
    .input("notification_id", sql.Int, notification_id)
    .query("SELECT * FROM Notifications WHERE notification_id=@notification_id");

  const row = result.recordset[0];
  if (!row) return null;

  return {
    ...row,
    created_time: formatDate(new Date(row.created_time)),
  };
}

// Update notification
async function updateNotification(notification_id, data) {
  const { room_id, message, type, created_time, is_read } = data;

  const formattedTime = created_time
    ? formatDate(new Date(created_time))
    : formatDate(new Date());

  const request = new sql.Request();
  await request
    .input("notification_id", sql.Int, notification_id)
    .input("room_id", sql.Int, room_id)
    .input("message", sql.NVarChar, message)
    .input("type", sql.NVarChar, type)
    .input("created_time", sql.DateTime, new Date(formattedTime))
    .input("is_read", sql.Bit, is_read ?? 0)
    .query(`
      UPDATE Notifications
      SET room_id=@room_id,
          message=@message,
          type=@type,
          created_time=@created_time,
          is_read=@is_read
      WHERE notification_id=@notification_id
    `);

  return getNotificationById(notification_id);
}

// Delete notification
async function deleteNotification(notification_id) {
  const request = new sql.Request();
  return await request
    .input("notification_id", sql.Int, notification_id)
    .query("DELETE FROM Notifications WHERE notification_id=@notification_id");
}

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
};
