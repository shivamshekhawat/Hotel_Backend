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

// Get all notifications with optional hotel filtering
// @param {number} [hotelId] - Optional hotel ID to filter notifications
async function getAllNotifications(hotelId = null) {
  const request = new sql.Request();
  
  let query = `
    SELECT n.*, r.room_number, r.hotel_id
    FROM Notifications n
    JOIN Rooms r ON n.room_id = r.room_id
  `;
  
  if (hotelId) {
    query += ' WHERE r.hotel_id = @hotelId';
    request.input('hotelId', sql.Int, hotelId);
  }
  
  query += ' ORDER BY n.created_time DESC';
  
  const result = await request.query(query);

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

// Send notification to single or multiple targets with hotel filtering
async function sendNotification(data) {
  const { message, target, targetId, priority = 'medium', hotel_id } = data;
  
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

  // Validate hotel_id if provided
  const parsedHotelId = hotel_id ? parseInt(hotel_id, 10) : null;
  if (hotel_id !== undefined && isNaN(parsedHotelId)) {
    throw new Error('hotel_id must be a valid number');
  }

  let targetIds = [];
  
  try {
    // Get all room IDs for the target with optional hotel filtering
    if (target === 'all') {
      const request = new sql.Request();
      let query = 'SELECT room_id FROM Rooms';
      
      if (parsedHotelId !== null) {
        query += ' WHERE hotel_id = @hotelId';
        request.input('hotelId', sql.Int, parsedHotelId);
      }
      
      const result = await request.query(query);
      targetIds = result.recordset.map(r => r.room_id);
    }
    // Get room ID for a specific room
    else if (target === 'room') {
      if (!targetId) {
        throw new Error('targetId is required for room target');
      }
      const roomId = parseInt(targetId);
      if (isNaN(roomId)) {
        throw new Error('Invalid room ID');
      }
      
      // Check if room exists and belongs to the specified hotel
      const request = new sql.Request();
      let query = 'SELECT room_id FROM Rooms WHERE room_id = @roomId';
      
      if (parsedHotelId !== null) {
        query += ' AND hotel_id = @hotelId';
        request.input('hotelId', sql.Int, parsedHotelId);
      }
      
      const result = await request
        .input('roomId', sql.Int, roomId)
        .query(query);
        
      if (result.recordset.length > 0) {
        targetIds = [roomId];
      } else if (parsedHotelId !== null) {
        throw new Error(`Room ${roomId} not found in hotel ${parsedHotelId}`);
      } else {
        throw new Error(`Room ${roomId} not found`);
      }
    }
    // Get room IDs for a specific floor
    else if (target === 'floor') {
      if (!targetId) {
        throw new Error('targetId (floor number) is required for floor target');
      }
      
      const request = new sql.Request();
      let query = 'SELECT room_id FROM Rooms WHERE floor_number = @floorNumber';
      
      if (parsedHotelId !== null) {
        query += ' AND hotel_id = @hotelId';
        request.input('hotelId', sql.Int, parsedHotelId);
      }
      
      const result = await request
        .input('floorNumber', sql.Int, targetId)
        .query(query);
        
      targetIds = result.recordset.map(r => r.room_id);
    }
    // Get room ID for a specific guest
    else if (target === 'guest') {
      if (!targetId) {
        throw new Error('targetId (guest ID) is required for guest target');
      }
      
      const guestId = parseInt(targetId);
      if (isNaN(guestId)) {
        throw new Error('Invalid guest ID');
      }
      
      const request = new sql.Request();
      let query = `
        SELECT r.room_id 
        FROM Reservations r
        JOIN Rooms rm ON r.room_id = rm.room_id
        WHERE r.guest_id = @guestId 
        AND r.check_out_time > GETDATE()
      `;
      
      if (parsedHotelId !== null) {
        query += ' AND rm.hotel_id = @hotelId';
        request.input('hotelId', sql.Int, parsedHotelId);
      }
      
      query += ' ORDER BY r.check_in_time DESC';
      
      const result = await request
        .input('guestId', sql.Int, guestId)
        .query(query);
        
      if (result.recordset.length > 0) {
        targetIds = [result.recordset[0].room_id];
      } else if (parsedHotelId !== null) {
        throw new Error(`No active reservation found for guest ${guestId} in hotel ${parsedHotelId}`);
      } else {
        throw new Error(`No active reservation found for guest ${guestId}`);
      }
    }
    // Handle multiple rooms
    else if (target === 'multipleRooms') {
      if (!Array.isArray(targetId)) {
        throw new Error('targetId must be an array for multipleRooms target');
      }
      
      const roomIds = targetId.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (roomIds.length === 0) {
        throw new Error('No valid room IDs provided');
      }
      
      // If hotel_id is provided, filter the rooms by hotel
      if (parsedHotelId !== null) {
        const request = new sql.Request();
        const result = await request
          .input('hotelId', sql.Int, parsedHotelId)
          .query(`
            SELECT room_id 
            FROM Rooms 
            WHERE room_id IN (${roomIds.join(',')}) 
            AND hotel_id = @hotelId
          `);
        targetIds = result.recordset.map(r => r.room_id);
      } else {
        targetIds = roomIds;
      }
    }

    // If no target IDs were found, return early
    if (targetIds.length === 0) {
      return {
        success: false,
        message: 'No valid targets found for the notification',
        sentCount: 0,
        failedCount: 0,
        failedTargets: [],
        notifications: []
      };
    }

    // Create notifications for each target
    const notifications = [];
    const now = formatDate(new Date());
    const failedTargets = [];
    
    for (const id of targetIds) {
      try {
        const notification = {
          room_id: id,
          message,
          type: priority,
          created_time: now,
          is_read: 0
        };

        // Insert the notification
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
