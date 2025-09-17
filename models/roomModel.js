const { sql } = require("../db");
const bcrypt = require("bcryptjs");

// ================== CREATE ROOM ==================
async function createRoom(roomData) {
  const {
    hotel_id,
    room_number,
    room_type,
    price,
    availability,
    capacity_adults,
    capacity_children,
    password,
  } = roomData;

  const request = new sql.Request();

  // ✅ Check duplicate room
  const duplicateCheck = await request
    .input("hotel_id", sql.Int, hotel_id)
    .input("room_number", sql.NVarChar, room_number)
    .query("SELECT * FROM Rooms WHERE hotel_id=@hotel_id AND room_number=@room_number");

  if (duplicateCheck.recordset.length > 0) {
    return { error: `Room ${room_number} already exists for hotel ${hotel_id}.` };
  }

  // ✅ Hash password
  let hashedPassword = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  // ✅ Insert new room
  const result = await request
    .input("hotel_id", sql.Int, hotel_id)
    .input("room_number", sql.NVarChar, room_number)
    .input("room_type", sql.NVarChar, room_type || "Standard")
    .input("price", sql.Float, price || 0)
    .input("availability", sql.Bit, availability ?? true)
    .input("capacity_adults", sql.Int, capacity_adults || 2)
    .input("capacity_children", sql.Int, capacity_children || 0)
    .input("password", sql.NVarChar, hashedPassword)
    .query(`
      INSERT INTO Rooms
      (hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children, password)
      OUTPUT INSERTED.*
      VALUES (@hotel_id, @room_number, @room_type, @price, @availability, @capacity_adults, @capacity_children, @password)
    `);

  const insertedRoom = result.recordset[0];
  delete insertedRoom.password; // Do not return password

  return { data: insertedRoom, status: 201 };
}

// ================== GET ALL ROOMS BY HOTEL ==================
async function getRooms(hotel_id) {
  const request = new sql.Request();
  const result = await request
    .input("hotel_id", sql.Int, hotel_id)
    .query("SELECT room_id, hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children FROM Rooms WHERE hotel_id=@hotel_id");
  return result.recordset;
}

// ================== GET ROOM BY ID ==================
async function getRoomById(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query("SELECT room_id, hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children FROM Rooms WHERE room_id=@room_id");
  return result.recordset[0];
}

// ================== UPDATE ROOM ==================
async function updateRoom(room_id, roomData) {
  const {
    room_number,
    room_type,
    price,
    availability,
    capacity_adults,
    capacity_children,
    password,
  } = roomData;

  const request = new sql.Request();

  // ✅ Hash password if provided
  let hashedPassword = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  // ✅ Update room
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("room_number", sql.NVarChar, room_number)
    .input("room_type", sql.NVarChar, room_type)
    .input("price", sql.Float, price)
    .input("availability", sql.Bit, availability)
    .input("capacity_adults", sql.Int, capacity_adults)
    .input("capacity_children", sql.Int, capacity_children)
    .input("password", sql.NVarChar, hashedPassword)
    .query(`
      UPDATE Rooms
      SET room_number=@room_number,
          room_type=@room_type,
          price=@price,
          availability=@availability,
          capacity_adults=@capacity_adults,
          capacity_children=@capacity_children,
          password=@password
      WHERE room_id=@room_id;
      SELECT room_id, hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children FROM Rooms WHERE room_id=@room_id;
    `);

  return result.recordset[0];
}

// ================== DELETE ROOM ==================
async function deleteRoom(room_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .query("DELETE FROM Rooms WHERE room_id=@room_id");
  return result.rowsAffected[0] > 0;
}

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
