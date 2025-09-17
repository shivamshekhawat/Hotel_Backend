const { sql } = require("../db");

// Create a new guest (avoid duplicates by email/phone)
async function createGuest(guestData) {
  const { first_name, last_name, email, phone, language } = guestData;

  if (!first_name || !email) {
    throw new Error("first_name and email are required fields");
  }

  const request = new sql.Request();

  // 🔎 Check if a guest already exists with same email or phone
  const checkQuery = `
    SELECT * FROM Guests WHERE email = @email OR phone = @phone
  `;
  const existing = await request
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone || "")
    .query(checkQuery);

  if (existing.recordset.length > 0) {
    // ❌ Throw error instead of silently returning existing guest
    throw new Error("Guest with this email or phone already exists");
  }

  // 🚀 Insert new guest
  const result = await request
    .input("first_name", sql.NVarChar, first_name)
    .input("last_name", sql.NVarChar, last_name || "")
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone || "")
    .input("language", sql.NVarChar, language || "EN")
    .query(`
      INSERT INTO Guests (first_name, last_name, email, phone, language)
      OUTPUT inserted.*
      VALUES (@first_name, @last_name, @email, @phone, @language)
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
  const { first_name, last_name, email, phone, language } = guestData;
  const request = new sql.Request();

  await request
    .input("guest_id", sql.Int, guest_id)
    .input("first_name", sql.NVarChar, first_name)
    .input("last_name", sql.NVarChar, last_name)
    .input("email", sql.NVarChar, email)
    .input("phone", sql.NVarChar, phone)
    .input("language", sql.NVarChar, language)
    .query(`
      UPDATE Guests
      SET first_name=@first_name,
          last_name=@last_name,
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
