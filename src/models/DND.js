const { sql, getPool } = require('../../config/database');

class DND {
  /**
   * Create DND record
   * @param {Object} dndData - DND data
   * @returns {Object} Created DND record
   */
  static async create(dndData) {
    const pool = await getPool();
    const request = pool.request();

    const { room_id, is_active = false } = dndData;

    const result = await request
      .input('room_id', sql.Int, room_id)
      .input('is_active', sql.Bit, is_active)
      .query(`
        INSERT INTO DND (room_id, is_active, create_date, update_date)
        OUTPUT INSERTED.*
        VALUES (@room_id, @is_active, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  }

  /**
   * Find DND by room ID
   * @param {Number} roomId - Room ID
   * @returns {Object} DND record
   */
  static async findByRoom(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query(`
        SELECT * FROM DND 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Update DND by room ID
   * @param {Number} roomId - Room ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated DND record
   */
  static async updateByRoom(roomId, updateData) {
    const pool = await getPool();
    const request = pool.request();

    const { is_active } = updateData;

    const result = await request
      .input('room_id', sql.Int, roomId)
      .input('is_active', sql.Bit, is_active)
      .query(`
        UPDATE DND 
        SET is_active = @is_active, update_date = GETDATE()
        WHERE room_id = @room_id;
        
        SELECT * FROM DND 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Delete DND record by room ID
   * @param {Number} roomId - Room ID
   * @returns {Boolean} Success status
   */
  static async deleteByRoom(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query('DELETE FROM DND WHERE room_id = @room_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Get all DND records for a hotel
   * @param {Number} hotelId - Hotel ID
   * @returns {Array} List of DND records
   */
  static async findByHotel(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        SELECT d.*, r.room_number, r.room_type
        FROM DND d
        INNER JOIN Rooms r ON d.room_id = r.room_id
        WHERE r.hotel_id = @hotel_id
        ORDER BY r.room_number
      `);

    return result.recordset;
  }

  /**
   * Get active DND rooms for a hotel
   * @param {Number} hotelId - Hotel ID
   * @returns {Array} List of active DND rooms
   */
  static async findActiveByHotel(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        SELECT d.*, r.room_number, r.room_type
        FROM DND d
        INNER JOIN Rooms r ON d.room_id = r.room_id
        WHERE r.hotel_id = @hotel_id AND d.is_active = 1
        ORDER BY r.room_number
      `);

    return result.recordset;
  }
}

module.exports = DND;
