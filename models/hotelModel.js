const { sql, pool } = require("../db");
const bcrypt = require("bcryptjs");



// ✅ Create hotel in DB (password already hashed)
async function createHotel(hotelData) {
  const {
    Name,
    Logo_url,
    Established_year,
    Address,
    Service_care_no,
    City,
    Country,
    Postal_code,
    UserName,
    access_token,
  } = hotelData;

 
  const request = new sql.Request();
  console.log('hotelData', UserName);
  return await request
    .input("Name", sql.NVarChar, Name || "")
    .input("Logo_url", sql.NVarChar, Logo_url || "")
    .input("Established_year", sql.Int, Established_year || new Date().getFullYear())
    .input("Address", sql.NVarChar, Address || "")
    .input("Service_care_no", sql.NVarChar, Service_care_no || "")
    .input("City", sql.NVarChar, City || "")
    .input("Country", sql.NVarChar, Country || "")
    .input("Postal_code", sql.NVarChar, Postal_code || "")
    .input("UserName", sql.NVarChar, UserName || "")
    .input("access_token", sql.NVarChar, access_token || "")
    .query(`
      INSERT INTO Hotels 
      (name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, access_token)
      OUTPUT inserted.*
      VALUES (@Name, @Logo_url, @Established_year, @Address, @Service_care_no, @City, @Country, @Postal_code, @UserName, @access_token)
    `);
}

// ✅ Find hotel by username
async function findHotelByUsername(UserName) {
  const request = new sql.Request();
  const result = await request
    .input("UserName", sql.NVarChar, UserName)
    .query("SELECT * FROM Hotels WHERE username=@UserName");
  return result.recordset[0];
}

// ✅ Find hotel by email
async function findHotelByEmail(email) {
  const request = new sql.Request();
  const result = await request
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM Hotels WHERE email=@email");
  return result.recordset[0];
}

// ✅ Create hotel with hashed password


async function updateToken(hotel_id, token) {
  const request = new sql.Request();
  return await request
    .input("hotel_id", sql.Int, hotel_id)
    .input("access_token", sql.NVarChar, token)
    .query("UPDATE Hotels SET access_token=@access_token WHERE hotel_id=@hotel_id");
}

// ✅ Get all hotels (exclude password)
async function getAllHotels() {
  const request = new sql.Request();
  const result = await request.query(`
    SELECT hotel_id, name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, access_token
    FROM Hotels
  `);
  return result.recordset;
}

// ✅ Get hotel by ID
async function getHotelById(hotelId) {
  const request = new sql.Request();
  const result = await request
    .input("hotel_id", sql.Int, hotelId)
    .query(`
      SELECT hotel_id, name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, access_token
      FROM Hotels
      WHERE hotel_id=@hotel_id
    `);
  return result.recordset[0];
}

// ✅ Update hotel
async function updateHotel(hotelId, hotelData) {
  const {
    Name,
    Logo_url,
    Established_year,
    Address,
    Service_care_no,
    City,
    Country,
    Postal_code,
    UserName,
    Password,
    access_token,
  } = hotelData;

  const request = new sql.Request();
  return await request
    .input("hotel_id", sql.Int, hotelId)
    .input("Name", sql.NVarChar, Name)
    .input("Logo_url", sql.NVarChar, Logo_url)
    .input("Established_year", sql.Int, Established_year)
    .input("Address", sql.NVarChar, Address)
    .input("Service_care_no", sql.NVarChar, Service_care_no)
    .input("City", sql.NVarChar, City)
    .input("Country", sql.NVarChar, Country)
    .input("Postal_code", sql.NVarChar, Postal_code)
    .input("UserName", sql.NVarChar, UserName)
    .input("Password", sql.NVarChar, Password)
    .input("access_token", sql.NVarChar, access_token)
    .query(`
      UPDATE Hotels
      SET name=@Name, logo_url=@Logo_url, established_year=@Established_year,
          address=@Address, service_care_no=@Service_care_no, city=@City,
          country=@Country, postal_code=@Postal_code, username=@UserName,
          password=@Password, access_token=@access_token
      WHERE hotel_id=@hotel_id
    `);
}

// ✅ Delete hotel
async function deleteHotel(hotelId) {
  const request = new sql.Request();
  return await request
    .input("hotel_id", sql.Int, hotelId)
    .query("DELETE FROM Hotels WHERE hotel_id=@hotel_id");
}


// ✅ Get dashboard data for a hotel
async function getDashboardData(hotelId) {
  const poolConn = await pool;

  // 1️⃣ Hotel
  const hotelResult = await poolConn.request()
    .input("hotelId", sql.Int, hotelId)
    .query(`SELECT hotel_id, name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, access_token 
            FROM Hotels WHERE hotel_id = @hotelId`);
  const hotel = hotelResult.recordset[0];
 

  if (!hotel) return null;

  // 2️⃣ Rooms
  const roomsResult = await poolConn.request()
    .input("hotelId", sql.Int, hotelId)
    .query(`SELECT *
            FROM Rooms WHERE hotel_id = @hotelId`);
  const rooms = roomsResult.recordset;

  const roomIds = rooms.map(r => r.room_id);
  if (roomIds.length === 0) {
    return { hotel, rooms: [], roomServices: [], technicalIssues: [], feedback: [], guests: [] };
  }

  // Prepare roomId params
  const roomIdsParams = roomIds.map((_, i) => `@roomId${i}`).join(",");
  const request = poolConn.request();
  roomIds.forEach((id, i) => request.input(`roomId${i}`, sql.Int, id));

  // 3️⃣ Room Services
  const roomServicesResult = await request.query(`
    SELECT rs.*
    FROM RoomServices rs
    JOIN Reservations r ON rs.reservation_id = r.reservation_id
    WHERE r.room_id IN (${roomIdsParams})
  `);
  const roomServices = roomServicesResult.recordset;

  // 4️⃣ Technical Issues
  const technicalIssuesResult = await request.query(`
    SELECT ti.*
    FROM TechnicalIssues ti
    JOIN Reservations r ON ti.reservation_id = r.reservation_id
    WHERE r.room_id IN (${roomIdsParams})
  `);
  const technicalIssues = technicalIssuesResult.recordset;

  // 5️⃣ Feedback
  const feedbackResult = await request.query(`
    SELECT f.*
    FROM Feedback f
    JOIN Reservations r ON f.reservation_id = r.reservation_id
    WHERE r.room_id IN (${roomIdsParams})
  `);
  const feedback = feedbackResult.recordset;

  // 6️⃣ Guests
  const guestsResult = await poolConn.request()
    .input("hotelId", sql.Int, hotelId)
    .query(`SELECT guest_id, first_name, last_name, email, phone, language
            FROM Guests WHERE hotel_id = @hotelId`);
  const guests = guestsResult.recordset;

  return { hotel, rooms, roomServices, technicalIssues, feedback, guests };
}





// ✅ Update password
async function updatePassword(hotelId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash with salt round 10

  const request = new sql.Request();
  return await request
    .input("hotel_id", sql.Int, hotelId)
    .input("Password", sql.NVarChar, hashedPassword)
    .query(`
      UPDATE Hotels
      SET password=@Password
      WHERE hotel_id=@hotel_id
    `);
}

// Check if admin already has a hotel
async function adminHasHotel(adminUsername) {
  const request = new sql.Request();
  const result = await request
    .input('username', sql.NVarChar, adminUsername)
    .query('SELECT COUNT(*) as hotelCount FROM Hotels WHERE username = @username');
  
  return result.recordset[0].hotelCount > 0;
}

module.exports = {
  createHotel,
  findHotelByEmail,
  getAllHotels,
  getHotelById,
  getDashboardData,
  updateHotel,
  deleteHotel,
  findHotelByUsername,
  updateToken,
  updatePassword,
  adminHasHotel
};
