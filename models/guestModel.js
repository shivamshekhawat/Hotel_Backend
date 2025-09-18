const { sql } = require("../db");

// Create a new guest (avoid duplicates by email/phone)
async function createGuest(guestData) {
  const { first_name, last_name, email, phone, language, hotel_id } = guestData;

  if (!first_name || !email) {
    throw new Error("first_name and email are required fields");
  }

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
    // ❌ THROW error (don’t return an object)
    throw new Error("Guest with this email or phone already exists");
  }

  // 🚀 Insert guest
  const result = await request
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

  return result.recordset[0];
}

// Get all guests
async function getAllGuests() {
  const request = new sql.Request();
  const result = await request.query(`SELECT * FROM Guests`);
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

module.exports = {
  createGuest,
  getAllGuests,
  getGuestById,
  updateGuest,
  deleteGuest,
};
