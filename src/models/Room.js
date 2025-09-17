const { sql, getPool } = require('../../config/database');

class Room {
  /**
   * Create a new room
   * @param {Object} roomData - Room data
   * @returns {Object} Created room
   */
  static async create(roomData) {
    const pool = await getPool();
    const request = pool.request();

    const {
      hotel_id,
      room_number,
      room_type = 'Standard',
      price = 0,
      availability = true,
      capacity_adults = 2,
      capacity_children = 0,
      password = null
    } = roomData;

    const result = await request
      .input('hotel_id', sql.Int, hotel_id)
      .input('room_number', sql.NVarChar, room_number)
      .input('room_type', sql.NVarChar, room_type)
      .input('price', sql.Float, price)
      .input('availability', sql.Bit, availability)
      .input('capacity_adults', sql.Int, capacity_adults)
      .input('capacity_children', sql.Int, capacity_children)
      .input('password', sql.NVarChar, password)
      .query(`
        INSERT INTO Rooms 
        (hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children, password)
        OUTPUT INSERTED.*
        VALUES (@hotel_id, @room_number, @room_type, @price, @availability, @capacity_adults, @capacity_children, @password)
      `);

    const room = result.recordset[0];
    // Remove password from response
    delete room.password;
    return room;
  }

  /**
   * Find rooms by hotel ID
   * @param {Number} hotelId - Hotel ID
   * @returns {Array} List of rooms
   */
  static async findByHotel(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        SELECT room_id, hotel_id, room_number, room_type, price, availability, 
               capacity_adults, capacity_children, create_date, update_date
        FROM Rooms 
        WHERE hotel_id = @hotel_id
        ORDER BY room_number
      `);

    return result.recordset;
  }

  /**
   * Find room by ID
   * @param {Number} roomId - Room ID
   * @returns {Object} Room data
   */
  static async findById(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query(`
        SELECT room_id, hotel_id, room_number, room_type, price, availability, 
               capacity_adults, capacity_children, create_date, update_date
        FROM Rooms 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Find room by hotel ID and room number
   * @param {Number} hotelId - Hotel ID
   * @param {String} roomNumber - Room number
   * @returns {Object} Room data
   */
  static async findByHotelAndNumber(hotelId, roomNumber) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .input('room_number', sql.NVarChar, roomNumber)
      .query(`
        SELECT room_id, hotel_id, room_number, room_type, price, availability, 
               capacity_adults, capacity_children, create_date, update_date
        FROM Rooms 
        WHERE hotel_id = @hotel_id AND room_number = @room_number
      `);

    return result.recordset[0];
  }

  /**
   * Update room
   * @param {Number} roomId - Room ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated room
   */
  static async update(roomId, updateData) {
    const pool = await getPool();
    const request = pool.request();

    const {
      room_number,
      room_type,
      price,
      availability,
      capacity_adults,
      capacity_children,
      password
    } = updateData;

    // Build dynamic query
    const updateFields = [];
    const inputs = { room_id: sql.Int, roomId };

    if (room_number !== undefined) {
      updateFields.push('room_number = @room_number');
      inputs.room_number = sql.NVarChar;
      inputs.room_number_value = room_number;
    }
    if (room_type !== undefined) {
      updateFields.push('room_type = @room_type');
      inputs.room_type = sql.NVarChar;
      inputs.room_type_value = room_type;
    }
    if (price !== undefined) {
      updateFields.push('price = @price');
      inputs.price = sql.Float;
      inputs.price_value = price;
    }
    if (availability !== undefined) {
      updateFields.push('availability = @availability');
      inputs.availability = sql.Bit;
      inputs.availability_value = availability;
    }
    if (capacity_adults !== undefined) {
      updateFields.push('capacity_adults = @capacity_adults');
      inputs.capacity_adults = sql.Int;
      inputs.capacity_adults_value = capacity_adults;
    }
    if (capacity_children !== undefined) {
      updateFields.push('capacity_children = @capacity_children');
      inputs.capacity_children = sql.Int;
      inputs.capacity_children_value = capacity_children;
    }
    if (password !== undefined) {
      updateFields.push('password = @password');
      inputs.password = sql.NVarChar;
      inputs.password_value = password;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('update_date = GETDATE()');

    // Add inputs to request
    Object.keys(inputs).forEach(key => {
      if (key !== 'room_id') {
        request.input(key, inputs[key], inputs[`${key}_value`]);
      }
    });

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query(`
        UPDATE Rooms 
        SET ${updateFields.join(', ')}
        WHERE room_id = @room_id;
        
        SELECT room_id, hotel_id, room_number, room_type, price, availability, 
               capacity_adults, capacity_children, create_date, update_date
        FROM Rooms 
        WHERE room_id = @room_id
      `);

    return result.recordset[0];
  }

  /**
   * Delete room
   * @param {Number} roomId - Room ID
   * @returns {Boolean} Success status
   */
  static async delete(roomId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('room_id', sql.Int, roomId)
      .query('DELETE FROM Rooms WHERE room_id = @room_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Check if room exists
   * @param {Number} roomId - Room ID
   * @returns {Boolean} Exists status
   */
  static async exists(roomId) {
    const room = await this.findById(roomId);
    return !!room;
  }
}

module.exports = Room;
