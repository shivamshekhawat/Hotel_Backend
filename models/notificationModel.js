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

  // Validate room_id is a valid integer
  const parsedRoomId = parseInt(room_id);
  if (isNaN(parsedRoomId) || parsedRoomId <= 0) {
    throw new Error("room_id must be a valid positive integer");
  }

  // Check if room exists
  const roomCheck = await new sql.Request()
    .input("room_id", sql.Int, parsedRoomId)
    .query("SELECT room_id FROM Rooms WHERE room_id = @room_id");
  
  if (roomCheck.recordset.length === 0) {
    throw new Error(`Room with ID ${parsedRoomId} does not exist`);
  }

  const formattedTime = created_time
    ? formatDate(new Date(created_time))
    : formatDate(new Date());

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, parsedRoomId)
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

  // Validate room_id if provided
  let parsedRoomId = room_id;
  if (room_id !== undefined) {
    parsedRoomId = parseInt(room_id);
    if (isNaN(parsedRoomId) || parsedRoomId <= 0) {
      throw new Error("room_id must be a valid positive integer");
    }

    // Check if room exists
    const roomCheck = await new sql.Request()
      .input("room_id", sql.Int, parsedRoomId)
      .query("SELECT room_id FROM Rooms WHERE room_id = @room_id");
    
    if (roomCheck.recordset.length === 0) {
      throw new Error(`Room with ID ${parsedRoomId} does not exist`);
    }
  }

  const formattedTime = created_time
    ? formatDate(new Date(created_time))
    : formatDate(new Date());

  const request = new sql.Request();
  await request
    .input("notification_id", sql.Int, notification_id)
    .input("room_id", sql.Int, parsedRoomId)
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

// Get notifications by room_id
async function getNotificationsByRoomId(room_id) {
  // Validate room_id is a valid integer
  const parsedRoomId = parseInt(room_id);
  if (isNaN(parsedRoomId) || parsedRoomId <= 0) {
    throw new Error("room_id must be a valid positive integer");
  }

  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, parsedRoomId) 
    .query("SELECT * FROM Notifications WHERE room_id=@room_id ORDER BY created_time DESC");
  return result.recordset;
}

// Delete notification
async function deleteNotification(notification_id) {
  const request = new sql.Request();
  return await request
    .input("notification_id", sql.Int, notification_id)
    .query("DELETE FROM Notifications WHERE notification_id=@notification_id");
}

// Send notification to single or multiple targets
async function sendNotification(data) {
  const { message, target, targetId, priority = 'medium' } = data;
  
  // Validate required fields
  if (!message || !target) {
    throw new Error('message and target are required');
  }

  // Validate target
  const validTargets = ['all', 'room', 'guest', 'floor', 'multipleRooms'];
  if (!validTargets.includes(target)) {
    throw new Error(`Invalid target. Must be one of: ${validTargets.join(', ')}`);
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }

  let targetIds = [];
  
  try {
    // Handle different target types
    if (target === 'all') {
      // Get all room IDs
      const result = await new sql.Request()
        .query('SELECT room_id FROM Rooms');
      targetIds = result.recordset.map(row => row.room_id.toString());
    } else if (target === 'multipleRooms') {
      // Ensure targetId is an array
      if (!Array.isArray(targetId)) {
        throw new Error('targetId must be an array when target is multipleRooms');
      }
      targetIds = targetId.map(id => id.toString());
    } else {
      // For single target, convert to array
      if (!targetId) {
        throw new Error(`targetId is required for target type: ${target}`);
      }
      targetIds = [targetId.toString()];
    }

    // Create notifications for each target
    const notifications = [];
    const now = formatDate(new Date());
    const failedTargets = [];
    
    for (const id of targetIds) {
      try {
        const notification = {
          room_id: target === 'all' || target === 'room' || target === 'multipleRooms' ? parseInt(id) : null,
          message,
          type: priority,
          created_time: now,
          is_read: 0
        };
        
        // Only process room notifications for now, as other types require additional columns
        if (target !== 'room' && target !== 'all' && target !== 'multipleRooms') {
          console.warn(`Skipping non-room target type: ${target}. Currently only room notifications are supported.`);
          failedTargets.push(id);
          continue;
        }

        // Check if room exists for room notifications
        if (notification.room_id) {
          const roomCheck = await new sql.Request()
            .input("room_id", sql.Int, notification.room_id)
            .query("SELECT room_id FROM Rooms WHERE room_id = @room_id");
          
          if (roomCheck.recordset.length === 0) {
            console.warn(`Skipping non-existent room ID: ${notification.room_id}`);
            failedTargets.push(notification.room_id);
            continue; // Skip to next iteration
          }
        }

        // Insert notification with only the columns that exist in the database
        const result = await new sql.Request()
          .input('room_id', sql.Int, notification.room_id)
          .input('message', sql.NVarChar, notification.message)
          .input('type', sql.NVarChar, notification.type)
          .input('created_time', sql.DateTime, new Date(notification.created_time))
          .input('is_read', sql.Bit, notification.is_read)
          .query(`
            INSERT INTO Notifications 
            (room_id, message, type, created_time, is_read)
            OUTPUT INSERTED.*
            VALUES (@room_id, @message, @type, @created_time, @is_read)
          `);

        notifications.push(result.recordset[0]);
      } catch (error) {
        console.error(`Failed to send notification to target ${id}:`, error.message);
        failedTargets.push(id);
      }
    }

    if (notifications.length === 0) {
      console.warn(`All notifications failed. Failed targets: ${failedTargets.join(', ')}`);
      return {
        success: false,
        message: `Failed to send notifications to all targets`,
        sentCount: 0,
        failedCount: failedTargets.length,
        failedTargets,
        notifications: []
      };
    }

    return {
      success: true,
      message: failedTargets.length > 0 
        ? `Notifications sent with ${failedTargets.length} failures` 
        : 'All notifications sent successfully',
      sentCount: notifications.length,
      failedCount: failedTargets.length,
      failedTargets,
      notifications
    };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
}

module.exports = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  getNotificationsByRoomId,
  deleteNotification,
  sendNotification
};
