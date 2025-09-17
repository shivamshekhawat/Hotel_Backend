const { sql, getPool } = require('../../config/database');

class RoomTemperature {
  /**
   * Create room temperature record
   * @param {Object} temperatureData - Temperature data
   * @returns {Object} Created temperature record
   */
  static async create(temperatureData) {
    const pool = await getPool();
    const request = pool.request();

    const { room_id, temperature = 24.0 } = temperatureData;

    const result = await request
      .input('room_id', sql.Int, room_id)
      .input('temperature', sql.Float, temperature)
      .query(`
        INSERT INTO RoomTemperature (room_id, temperature, create_date, update_date)
        OUTPUT INSERTED.*
        VALUES (@room_id, @temperature, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  }

  /**
   * Find temperature by room ID
   * @param {Number} roomId - Room ID
   * @returns {Object} Temperature record
   */
  static async findByRoom(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query(`
        SELECT * FROM RoomTemperature 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Update temperature by room ID
   * @param {Number} roomId - Room ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated temperature record
   */
  static async updateByRoom(roomId, updateData) {
    const pool = await getPool();
    const request = pool.request();

    const { temperature } = updateData;

    const result = await request
      .input('room_id', sql.Int, roomId)
      .input('temperature', sql.Float, temperature)
      .query(`
        UPDATE RoomTemperature 
        SET temperature = @temperature, update_date = GETDATE()
        WHERE room_id = @room_id;
        
        SELECT * FROM RoomTemperature 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Delete temperature record by room ID
   * @param {Number} roomId - Room ID
   * @returns {Boolean} Success status
   */
  static async deleteByRoom(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query('DELETE FROM RoomTemperature WHERE room_id = @room_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Get all temperature records for a hotel
   * @param {Number} hotelId - Hotel ID
   * @returns {Array} List of temperature records
   */
  static async findByHotel(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        SELECT rt.*, r.room_number, r.room_type
        FROM RoomTemperature rt
        INNER JOIN Rooms r ON rt.room_id = r.room_id
        WHERE r.hotel_id = @hotel_id
        ORDER BY r.room_number
      `);

    return result.recordset;
  }
}

module.exports = RoomTemperature;
