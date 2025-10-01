const { sql } = require("../db");

/**
 * Create a new reservation
 */
async function createReservation(data) {
  const { guest_id, room_id, check_in_time, check_out_time, is_checked_in } = data;

  // Validate required fields
  if (!guest_id || !room_id || !check_in_time || !check_out_time) {
    throw new Error("guest_id, room_id, check_in_time, and check_out_time are required");
  }

  // Validate check-in/out times
  if (new Date(check_out_time) <= new Date(check_in_time)) {
    throw new Error("check_out_time must be later than check_in_time");
  }

  // Check if reservation already exists for the same guest & room
  const existingRequest = new sql.Request();
  const existing = await existingRequest
    .input("guest_id", sql.Int, guest_id)
    .input("room_id", sql.Int, room_id)
    .query(`
      SELECT * 
      FROM Reservations 
      WHERE (guest_id = @guest_id OR room_id = @room_id) AND is_checked_in = 1
    `);

  if (existing.recordset.length > 0) {
    throw new Error("Reservation already exists for this guest Or room");
  }

  // Insert new reservation
  const insertRequest = new sql.Request();
  const result = await insertRequest
    .input("guest_id", sql.Int, guest_id)
    .input("room_id", sql.Int, room_id)
    .input("check_in_time", sql.DateTime, new Date(check_in_time))
    .input("check_out_time", sql.DateTime, new Date(check_out_time))
    .input("is_checked_in", sql.Bit, is_checked_in || false)
    .query(`
      INSERT INTO Reservations (guest_id, room_id, check_in_time, check_out_time, is_checked_in)
      OUTPUT inserted.*
      VALUES (@guest_id, @room_id, @check_in_time, @check_out_time, @is_checked_in)
    `);

  return result.recordset[0];
}

/**
 * Get all reservations with optional hotel filtering
 * @param {number} [hotelId] - Optional hotel ID to filter reservations
 */
async function getAllReservations(hotelId = null) {
  const request = new sql.Request();
  
  let query = `
    SELECT r.*, g.*, rm.* 
    FROM Reservations r
    JOIN Guests g ON r.guest_id = g.guest_id
    JOIN Rooms rm ON r.room_id = rm.room_id
  `;
  
  if (hotelId) {
    query += ' WHERE rm.hotel_id = @hotelId';
    request.input('hotelId', sql.Int, hotelId);
  }
  
  query += ' ORDER BY r.check_in_time DESC';
  
  const result = await request.query(query);
  return result.recordset;
}

/**
 * Get a reservation by ID
 */
async function getReservationById(reservation_id) {
  const request = new sql.Request();
  const result = await request
    .input("reservation_id", sql.Int, reservation_id)
    .query("SELECT * FROM Reservations WHERE reservation_id = @reservation_id");

  return result.recordset[0];
}

/**
 * Update a reservation
 */
async function updateReservation(reservation_id, data) {
  const { guest_id, room_id, check_in_time, check_out_time, is_checked_in } = data;

  // Get current reservation to check if it's currently checked in
  const currentReservation = await getReservationById(reservation_id);
  if (!currentReservation) {
    throw new Error("Reservation not found");
  }

  // If changing from checked in (true) to checked out (false), update checkout time
  let finalCheckOutTime = check_out_time;
  if (currentReservation.is_checked_in === true && is_checked_in === false) {
    // Update checkout time to current time when checking out
    finalCheckOutTime = new Date().toISOString();
    console.log(`Guest checking out - updating checkout time to: ${finalCheckOutTime}`);
  }

  // Validate check-in/out times only if both are provided
  if (check_in_time && finalCheckOutTime) {
    if (new Date(finalCheckOutTime) <= new Date(check_in_time)) {
      throw new Error("check_out_time must be later than check_in_time");
    }
  }

  const request = new sql.Request();
  await request
    .input("reservation_id", sql.Int, reservation_id)
    .input("guest_id", sql.Int, guest_id || currentReservation.guest_id)
    .input("room_id", sql.Int, room_id || currentReservation.room_id)
    .input("check_in_time", sql.DateTime, check_in_time ? new Date(check_in_time) : currentReservation.check_in_time)
    .input("check_out_time", sql.DateTime, finalCheckOutTime ? new Date(finalCheckOutTime) : currentReservation.check_out_time)
    .input("is_checked_in", sql.Bit, is_checked_in !== undefined ? is_checked_in : currentReservation.is_checked_in)
    .query(`
      UPDATE Reservations
      SET guest_id = @guest_id,
          room_id = @room_id,
          check_in_time = @check_in_time,
          check_out_time = @check_out_time,
          is_checked_in = @is_checked_in
      WHERE reservation_id = @reservation_id
    `);
    
  return getReservationById(reservation_id);
}

/**
 * Get reservation by room ID
 */
async function getReservationByRoomId(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query(`
      SELECT r.*, g.*, rm.* 
      FROM Reservations r
      JOIN Guests g ON r.guest_id = g.guest_id
      JOIN Rooms rm ON r.room_id = rm.room_id
      WHERE r.room_id = @room_id
      AND r.is_checked_in = 1
      ORDER BY r.check_in_time DESC
    `);

  return result.recordset[0] || null;
}

/**
 * Delete a reservation
 */
async function deleteReservation(reservation_id) {
  const request = new sql.Request();
  await request
    .input("reservation_id", sql.Int, reservation_id)
    .query("DELETE FROM Reservations WHERE reservation_id = @reservation_id");

  return { message: "Reservation deleted successfully" };
}

module.exports = {
  createReservation,
  getReservationByRoomId,
  getAllReservations,
  getReservationById,
  updateReservation,
  deleteReservation,
};
