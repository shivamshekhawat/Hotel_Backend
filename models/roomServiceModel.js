const { sql } = require("../db");

// ✅ Create a new room service request (avoid duplicates for same reservation)
async function createRoomService(data) {
  const { reservation_id, service_type, request_time, status } = data;

  if (!reservation_id || !service_type) {
    throw new Error("reservation_id and service_type are required");
  }

  const request = new sql.Request();

  // 🔎 Check if a request already exists for this reservation_id
  const existing = await request
    .input("reservation_id", sql.Int, reservation_id)
    .query(`SELECT * FROM RoomServices WHERE reservation_id = @reservation_id`);

  if (existing.recordset.length > 0) {
    throw new Error("Room service request for this reservation already exists");
  }

  // 🚀 Insert new request
  const result = await request
    .input("reservation_id", sql.Int, reservation_id)
    .input("service_type", sql.NVarChar, service_type)
    .input("request_time", sql.DateTime, request_time ? new Date(request_time) : new Date())
    .input("status", sql.NVarChar, status || "Requested")
    .query(`
      INSERT INTO RoomServices (reservation_id, service_type, request_time, status)
      OUTPUT inserted.*
      VALUES (@reservation_id, @service_type, @request_time, @status)
    `);

  return result.recordset[0];
}

// ✅ Get all room services
async function getAllRoomServices() {
  const request = new sql.Request();
  const result = await request.query("SELECT * FROM RoomServices");
  return result.recordset;
}

// ✅ Get room service by ID
async function getRoomServiceById(service_id) {
  const request = new sql.Request();
  const result = await request
    .input("service_id", sql.Int, service_id)
    .query("SELECT * FROM RoomServices WHERE service_id=@service_id");

  return result.recordset[0] || null;
}

// ✅ Update room service
async function updateRoomService(service_id, data) {
  const { reservation_id, service_type, request_time, status } = data;

  const request = new sql.Request();
  await request
    .input("service_id", sql.Int, service_id)
    .input("reservation_id", sql.Int, reservation_id)
    .input("service_type", sql.NVarChar, service_type)
    .input("request_time", sql.DateTime, request_time ? new Date(request_time) : new Date())
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE RoomServices
      SET reservation_id=@reservation_id,
          service_type=@service_type,
          request_time=@request_time,
          status=@status
      WHERE service_id=@service_id
    `);

  return getRoomServiceById(service_id);
}

// ✅ Delete room service
async function deleteRoomService(service_id) {
  const request = new sql.Request();
  return await request
    .input("service_id", sql.Int, service_id)
    .query("DELETE FROM RoomServices WHERE service_id=@service_id");
}

module.exports = {
  createRoomService,
  getAllRoomServices,
  getRoomServiceById,
  updateRoomService,
  deleteRoomService,
};
