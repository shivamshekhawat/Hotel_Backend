const { sql, poolConnect } = require("../db");

const roomGreetingModel = {
  // Get greeting message by room ID and language
  getGreetingByRoomId: async (roomId, language = 'en') => {
    try {
      const pool = await poolConnect();
      const result = await pool
        .request()
        .input('roomId', sql.Int, roomId)
        .input('language', sql.NVarChar(10), language)
        .query(`
          SELECT TOP 1 message 
          FROM roomGreeting 
          WHERE room_id = @roomId 
          AND language = @language
          ORDER BY created_at DESC
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error in getGreetingByRoomId:', error);
      return null;
    }
  },

  // Add or update greeting message for a room
  upsertGreeting: async (roomId, language, message) => {
    try {
      const pool = await poolConnect();
      const result = await pool
        .request()
        .input('roomId', sql.Int, roomId)
        .input('language', sql.NVarChar(10), language)
        .input('message', sql.NVarChar(sql.MAX), message)
        .query(`
          IF EXISTS (SELECT 1 FROM roomGreeting WHERE room_id = @roomId AND language = @language)
            UPDATE roomGreeting 
            SET message = @message, updated_at = GETDATE()
            WHERE room_id = @roomId AND language = @language
          ELSE
            INSERT INTO roomGreeting (room_id, language, message)
            VALUES (@roomId, @language, @message)
        `);

      return { success: true };
    } catch (error) {
      console.error('Error in upsertGreeting:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = roomGreetingModel;
