const { sql } = require("../db");
const bcrypt = require("bcryptjs");
const roomControlModel = require("./roomControlModel");
const roomTemperatureModel = require("./roomTemperatureModel");
const DoNotDisturb = require("./doNotDisturbModel")

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
    username,
    password,
  } = roomData;

  const request = new sql.Request();

  // ✅ Check duplicate room
  // Duplicate check
// const duplicateCheck = await new sql.Request()
//   .input("hotel_id", sql.Int, hotel_id)
//   .input("room_number", sql.NVarChar, room_number)
//   .input("username", sql.NVarChar, username)
//   .query("SELECT * FROM Rooms WHERE hotel_id=@hotel_id AND room_number=@room_number AND username=@username");

// if (duplicateCheck.recordset.length > 0) {
//   return { error: `Room ${room_number} already exists for hotel ${hotel_id}.` };
// }

// Insert new room
const result = await new sql.Request()
  .input("hotel_id", sql.Int, hotel_id)
  .input("room_number", sql.NVarChar, room_number)
  .input("username", sql.NVarChar, username)
  .input("room_type", sql.NVarChar, room_type || "Standard")
  .input("price", sql.Float, price || 0)
  .input("availability", sql.Bit, availability ?? true)
  .input("capacity_adults", sql.Int, capacity_adults || 2)
  .input("capacity_children", sql.Int, capacity_children || 0)
  .input("password", sql.NVarChar, password)
  .query(`
    INSERT INTO Rooms
    (hotel_id, room_number, room_type, price, availability, capacity_adults, capacity_children, password, username)
    OUTPUT INSERTED.*
    VALUES (@hotel_id, @room_number, @room_type, @price, @availability, @capacity_adults, @capacity_children, @password, @username)
  `);

const insertedRoom = result.recordset[0];
delete insertedRoom.password;

// Insert DND

  await new sql.Request()
  .input("room_id", sql.Int, insertedRoom.room_id)
  .input("is_active", sql.Bit, 0)
  .input("updated_time", sql.DateTime, new Date())
  .query(`
    INSERT INTO DoNotDisturb (room_id, is_active, updated_time) 
    OUTPUT INSERTED.*
    VALUES (@room_id, @is_active, @updated_time)
  `);

  await roomControlModel.createRoomControl({room_id: insertedRoom.room_id, master_light: 0, reading_light: 0, master_curtain: 0, master_window: 0, light_mode: "Warm"});
  await roomTemperatureModel.createRoomTemperature({room_id: insertedRoom.room_id, temperature: 24.0});
  // await dndModel.createDND({room_id: insertedRoom.room_id, is_active: 0});
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
async function loginRoom(roomData) {
  const { password, userId } = roomData;
  const request = new sql.Request();
  console.log(userId, password);
  const result = await request
    .input("user_name", sql.NVarChar, userId)
    .input("password", sql.NVarChar, password)
    .query("SELECT * FROM Rooms WHERE username=@user_name AND password=@password");
  return result.recordset[0];

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

// ================== UPDATE TOKEN ==================
async function updateToken(room_id, token) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("jwt_token", sql.NVarChar, token)
    .query(`
      UPDATE Rooms 
      SET jwt_token=@jwt_token 
      WHERE room_id=@room_id;
      SELECT room_id, jwt_token FROM Rooms WHERE room_id=@room_id;
    `);
  return result.recordset[0];
}

// ================== UPDATE FCM TOKEN ==================
async function updateFcmToken(room_id, fcm_token) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("fcm_token", sql.NVarChar, fcm_token)
    .query(`
      UPDATE Rooms 
      SET fcm_token=@fcm_token
      WHERE room_id=@room_id;
      SELECT room_id, fcm_token FROM Rooms WHERE room_id=@room_id;
    `);
  return result.recordset[0];
}

// ================== UPDATE DEVICE ID ==================
async function updateDeviceId(room_id, device_id) {
  const request = new sql.Request();
  const result = await request
    .input("room_id", sql.Int, room_id)
    .input("device_id", sql.NVarChar, device_id)
    .query(`
      UPDATE Rooms 
      SET device_id=@device_id
      WHERE room_id=@room_id;
      SELECT room_id, device_id FROM Rooms WHERE room_id=@room_id;
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
  loginRoom,
  updateToken,
  updateFcmToken,
  updateDeviceId
};
