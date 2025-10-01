const { sql } = require("../db");

// Create a new guest (avoid duplicates by email/phone)
async function createGuest(guestData) {
  const { first_name, last_name, email, phone, language, hotel_id } = guestData;

  // Validate required fields
  if (!first_name || !email) {
    throw new Error("first_name and email are required fields");
  }

  // Create a new SQL request
  const request = new sql.Request();

  // 🔎 Check if guest already exists
  const checkQuery = `
    SELECT * FROM Guests WHERE email = @email OR phone = @phone
  `;
  const existing = await request
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone || "")
    .query(checkQuery);

  if (existing.recordset.length > 0) {
    // ❌ Throw error if guest exists
    throw new Error("Guest with this email or phone already exists");
  }

  // 🚀 Insert guest
  const insertRequest = new sql.Request();
const result = await insertRequest
  .input("first_name", sql.NVarChar, first_name)
  .input("last_name", sql.NVarChar, last_name || "")
  .input("email", sql.NVarChar, email)
  .input("phone", sql.NVarChar, phone || "")
  .input("language", sql.NVarChar, language || "EN")
  .input("hotel_id", sql.Int, hotel_id)
  .query(`
      INSERT INTO Guests (first_name, last_name, email, phone, language, hotel_id)
      OUTPUT inserted.*
      VALUES (@first_name, @last_name, @email, @phone, @language, @hotel_id)
  `);

  // Return the inserted guest
  return result.recordset[0];
}
// Get all guests with optional hotel filtering
async function getAllGuests(hotelId = null) {
  const request = new sql.Request();
  let query = 'SELECT * FROM Guests';
  
  if (hotelId) {
    query += ' WHERE hotel_id = @hotelId';
    request.input('hotelId', sql.Int, hotelId);
  }
  
  const result = await request.query(query);
  return result.recordset;
}

// Get single guest by ID
async function getGuestById(guest_id) {
  const request = new sql.Request();
  const result = await request
    .input("guest_id", sql.Int, guest_id)
    .query("SELECT * FROM Guests WHERE guest_id=@guest_id");
  return result.recordset[0];
}

// Update guest
async function updateGuest(guest_id, guestData) {
  const { first_name, last_name, email, phone, language, hotel_id } = guestData;
  const request = new sql.Request();

  await request
    .input("guest_id", sql.Int, guest_id)
    .input("first_name", sql.NVarChar, first_name)
    .input("hotel_id", sql.Int, hotel_id)
    .input("last_name", sql.NVarChar, last_name)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .input("language", sql.NVarChar, language)
    .query(`
      UPDATE Guests
      SET first_name=@first_name,
          last_name=@last_name,
          hotel_id=@hotel_id,
          email=@email,
          phone=@phone,
          language=@language
      WHERE guest_id=@guest_id
    `);

  // Return updated guest
  return getGuestById(guest_id);
}

// Delete guest
async function deleteGuest(guest_id) {
  const request = new sql.Request();
  return await request
    .input("guest_id", sql.Int, guest_id)
    .query("DELETE FROM Guests WHERE guest_id=@guest_id");
}

// Get all guests with their room information
// Handles cases with invalid guest_id and provides better error handling
// @param {number} [hotelId] - Optional hotel ID to filter guests by hotel
async function getGuestsWithRooms(hotelId = null) {
  try {
    const request = new sql.Request();
    
    let query = `
      SELECT 
        g.guest_id,
        g.first_name,
        g.last_name,
        g.email,
        g.phone,
        g.language,
        g.hotel_id,
        r.room_number,
        r.room_id,
        res.check_in_time,
        res.check_out_time,
        res.is_checked_in,
        res.reservation_id
      FROM Guests g
      LEFT JOIN (
        SELECT * FROM Reservations 
        WHERE guest_id IS NOT NULL 
        AND ISNUMERIC(guest_id) = 1  -- Only include numeric guest_ids
      ) res ON g.guest_id = res.guest_id
      LEFT JOIN Rooms r ON res.room_id = r.room_id
      WHERE g.guest_id IS NOT NULL
      AND ISNUMERIC(g.guest_id) = 1  -- Only include numeric guest_ids
    `;
    
    // Add hotel filter if hotelId is provided
    if (hotelId) {
      query += ` AND g.hotel_id = @hotelId`;
      request.input('hotelId', sql.Int, hotelId);
    }
    
    // Add sorting
    query += ` ORDER BY g.last_name, g.first_name`;
    
    const result = await request.query(query);
    
    // Process the results to ensure data consistency
    const processedResults = result.recordset.map(record => ({
      ...record,
      guest_id: Number(record.guest_id),
      room_id: record.room_id ? Number(record.room_id) : null,
      hotel_id: record.hotel_id ? Number(record.hotel_id) : null,
      is_checked_in: record.is_checked_in === 1 || record.is_checked_in === true
    }));

    return processedResults;
  } catch (error) {
    console.error('Error in getGuestsWithRooms:', error);
    throw new Error('Failed to fetch guests with room information');
  }
}

module.exports = {
  createGuest,
  getGuestsWithRooms,
  getAllGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
};
