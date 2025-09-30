const { sql } = require("../db");
const bcrypt = require("bcryptjs");
const { v4: uuidv4, validate: uuidValidate } = require("uuid");

// ✅ Create admin in DB
async function createAdmin(adminData) {
  const {
    first_name,
    last_name,
    email,
    mobile_number,
    session_id,
    username,
    password,
  } = adminData;

  // Store plain text password (not recommended for production)
  const request = new sql.Request();
  const sessionId = (session_id && uuidValidate(session_id)) ? session_id : uuidv4();

  const result = await request
    .input("first_name", sql.VarChar, first_name || "")
    .input("last_name", sql.VarChar, last_name || "")
    .input("email", sql.VarChar, email || "")
    .input("mobile_number", sql.VarChar, mobile_number || "")
    .input("token", sql.VarChar, "")
    .input("role", sql.VarChar, "admin")
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("username", sql.VarChar, username || "")
    .input("password", sql.VarChar, password) // Store plain text password
    .query(`
      INSERT INTO Admins
      (first_name, last_name, email, mobile_number, token, role, session_id, username, password)
      VALUES (@first_name, @last_name, @email, @mobile_number, @token, @role, @session_id, @username, @password);
      SELECT SCOPE_IDENTITY() as admin_id;
    `);

  return result.recordset[0];
}

// ✅ Get all admins
async function getAllAdmins() {
  const request = new sql.Request();
  const result = await request.query(`
    SELECT admin_id, first_name, last_name, email, mobile_number, username, role, created_at, updated_at
    FROM Admins
    ORDER BY created_at DESC;
  `);
  return result.recordset;
}

// ✅ Get admin by ID
async function getAdminById(adminId) {
  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .query(`
      SELECT *
      FROM Admins
      WHERE admin_id = @admin_id;
    `);
  
  return result.recordset[0] || null;
}

// ✅ Find admin by username
async function findAdminByUsername(username) {
  const request = new sql.Request();
  const result = await request
    .input('username', sql.VarChar, username)
    .query(`
      SELECT *
      FROM Admins
      WHERE username = @username;
    `);
  
  return result.recordset[0] || null;
}

// ✅ Find admin by email
async function findAdminByEmail(email) {
  const request = new sql.Request();
  const result = await request
    .input('email', sql.VarChar, email)
    .query(`
      SELECT *
      FROM Admins
      WHERE email = @email;
    `);
  
  return result.recordset[0] || null;
}

// ✅ Find admin by mobile number
async function findAdminByMobile(mobileNumber) {
  const request = new sql.Request();
  const result = await request
    .input('mobile_number', sql.VarChar, mobileNumber)
    .query(`
      SELECT *
      FROM Admins
      WHERE mobile_number = @mobile_number;
    `);
  
  return result.recordset[0] || null;
}

// ✅ Update admin token
async function updateAdminToken(adminId, token) {
  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .input('token', sql.VarChar, token)
    .query(`
      UPDATE Admins
      SET token = @token,
          updated_at = GETDATE()
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

// ✅ Update admin details
async function updateAdmin(adminId, updateData) {
  const {
    first_name,
    last_name,
    email,
    mobile_number,
    username,
    role
  } = updateData;

  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .input('first_name', sql.VarChar, first_name)
    .input('last_name', sql.VarChar, last_name)
    .input('email', sql.VarChar, email)
    .input('mobile_number', sql.VarChar, mobile_number)
    .input('username', sql.VarChar, username)
    .input('role', sql.VarChar, role)
    .query(`
      UPDATE Admins
      SET first_name = @first_name,
          last_name = @last_name,
          email = @email,
          mobile_number = @mobile_number,
          username = @username,
          role = @role,
          updated_at = GETDATE()
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

// ✅ Delete admin (hard delete)
async function deleteAdmin(adminId) {
  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .query(`
      DELETE FROM Admins
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

// ✅ Update admin OTP
async function updateAdminOTP(adminId, otp, otpExpiry = new Date(Date.now() + 5 * 60 * 1000)) {
  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .input('otp', sql.VarChar, otp)
    .input('otp_expiry', sql.DateTime, otpExpiry)
    .query(`
      UPDATE Admins
      SET otp = @otp,
          otp_expiry = @otp_expiry,
          updated_at = GETDATE()
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

// ✅ Verify admin OTP
async function verifyAdminOTP(adminId, otp) {
  try {
    console.log(`Verifying OTP for admin ${adminId}`);
    console.log(`OTP to verify: ${otp}`);
    
    // First, get the current OTP and expiry from the database
    const adminInfo = await getAdminById(adminId);
    console.log('Current OTP in DB:', adminInfo.otp);
    console.log('OTP expiry in DB:', adminInfo.otp_expiry);
    console.log('Current server time:', new Date());

    const request = new sql.Request();
    const result = await request
      .input('admin_id', sql.Int, adminId)
      .input('otp', sql.VarChar, otp)
      .query(`
        SELECT admin_id
        FROM Admins
        WHERE admin_id = @admin_id 
          AND otp = @otp 
          AND otp_expiry > GETDATE();
      `);
    
    console.log('OTP verification result:', result.recordset[0] ? 'Valid' : 'Invalid');
    return result.recordset[0] || null;
  } catch (error) {
    console.error('Error in verifyAdminOTP:', error);
    throw error;
  }
}

// ✅ Clear admin OTP
async function clearAdminOTP(adminId) {
  const request = new sql.Request();
  const result = await request
    .input('admin_id', sql.Int, adminId)
    .query(`
      UPDATE Admins
      SET otp = NULL,
          otp_expiry = NULL,
          updated_at = GETDATE()
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

// ✅ Update admin password
async function updateAdminPassword(adminId, newPassword) {
  const request = new sql.Request();
  const result = await request
    .input("admin_id", sql.Int, adminId)
    .input("password", sql.VarChar, newPassword) // Store plain text password
    .query(`
      UPDATE Admins 
      SET password = @password,
          updated_at = GETDATE()
      WHERE admin_id = @admin_id;
    `);
  
  return result.rowsAffected[0] > 0;
}

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  findAdminByUsername,
  findAdminByEmail,
  findAdminByMobile,
  updateAdminToken,
  updateAdmin,
  deleteAdmin,
  updateAdminOTP,
  verifyAdminOTP,
  clearAdminOTP,
  updateAdminPassword
};