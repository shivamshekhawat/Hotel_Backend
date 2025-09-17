const { sql } = require("../db");
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
    Password,
    access_token,
  } = hotelData;

 
  const request = new sql.Request();
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
    .input("Password", sql.NVarChar, Password || "")
    .input("access_token", sql.NVarChar, access_token || "")
    .query(`
      INSERT INTO Hotels 
      (name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, password, access_token)
      VALUES (@Name, @Logo_url, @Established_year, @Address, @Service_care_no, @City, @Country, @Postal_code, @UserName, @Password, @access_token)
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

// ✅ Create hotel with hashed password
async function createHotelWithHash(hotelData) {
  return createHotel(hotelData);
}

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

module.exports = {
  createHotel,
  createHotelWithHash,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  findHotelByUsername,
  updateToken
};
