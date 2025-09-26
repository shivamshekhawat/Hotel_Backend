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
    token,
    role,
    session_id,
    username,
    password,
  } = adminData;

  // const hashedPassword = await bcrypt.hash(password, 10);
  const request = new sql.Request();
  const sessionId = (session_id && uuidValidate(session_id)) ? session_id : uuidv4();

  const result = await request
    .input("first_name", sql.NVarChar, first_name || "")
    .input("last_name", sql.NVarChar, last_name || "")
    .input("email", sql.NVarChar, email || "")
    .input("mobile_number", sql.NVarChar, mobile_number || "")
    .input("token", sql.NVarChar, token || "")
    .input("role", sql.NVarChar, role || "admin")
    .input("session_id", sql.UniqueIdentifier, sessionId)
    .input("username", sql.NVarChar, username || "")
    .input("password", sql.NVarChar, password)
    .query(`
      INSERT INTO Admins
      (first_name, last_name, email, mobile_number, token, role, session_id, username, password)
      VALUES (@first_name, @last_name, @email, @mobile_number, @token, @role, @session_id, @username, @password);
    SELECT SCOPE_IDENTITY() as admin_id;
    `);

  console.log("SQL Result:", result); // Debug log
  return result.recordset[0];
}


// ✅ Find admin by username
async function findAdminByUsername(username) {
  const request = new sql.Request();
  const result = await request
    .input("username", sql.NVarChar, username)
    .query("SELECT * FROM Admins WHERE username=@username");
  return result.recordset[0];
}

// ✅ Find admin by email
async function findAdminByEmail(email) {
  const request = new sql.Request();
  const result = await request
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM Admins WHERE email=@email");
  return result.recordset[0];
}

// ✅ Find admin by mobile number
async function findAdminByMobile(mobile_number) {
  const request = new sql.Request();
  const result = await request
    .input("mobile_number", sql.NVarChar, mobile_number)
    .query("SELECT * FROM Admins WHERE mobile_number=@mobile_number");
  return result.recordset[0];
}

// ✅ Update admin token
async function updateAdminToken(admin_id, token) {
  const request = new sql.Request();
  return await request
    .input("admin_id", sql.Int, admin_id)
    .input("token", sql.NVarChar, token)
    .query("UPDATE Admins SET token=@token, updated_at=GETDATE() WHERE admin_id=@admin_id");
}

// ✅ Get all admins (exclude password)
async function getAllAdmins() {
  const request = new sql.Request();
  
  const result = await request.query(`
    SELECT admin_id, first_name, last_name, email, mobile_number, token, role, session_id, username
    FROM Admins
  `);
  return result.recordset;
}

// ✅ Get admin by ID (including password for internal use)
async function getAdminById(adminId) {
  const request = new sql.Request();
  const result = await request
    .input("admin_id", sql.Int, adminId)
    .query(`
      SELECT admin_id, first_name, last_name, email, mobile_number, token, role, session_id, username, password
      FROM Admins
      WHERE admin_id=@admin_id
    `);
  return result.recordset[0];
}

// ✅ Update admin
async function updateAdmin(adminId, adminData) {
  const {
    first_name,
    last_name,
    email,
    mobile_number,
    token,
    role,
    session_id,
    password,
  } = adminData;

  // Check for duplicate email (only if email is being updated)
  if (email) {
    const existingAdminByEmail = await findAdminByEmail(email);
    if (existingAdminByEmail && existingAdminByEmail.admin_id != adminId) {
      throw new Error("Email already exists");
    }
  }

  // Check for duplicate mobile (only if mobile is being updated)
  if (mobile_number) {
    const existingAdminByMobile = await findAdminByMobile(mobile_number);
    if (existingAdminByMobile && existingAdminByMobile.admin_id != adminId) {
      throw new Error("Mobile number already exists");
    }
  }

  // Build dynamic update query based on provided fields
  let updateFields = [];
  let inputs = {};
  
  if (first_name !== undefined) {
    updateFields.push("first_name=@first_name");
    inputs.first_name = first_name;
  }
  if (last_name !== undefined) {
    updateFields.push("last_name=@last_name");
    inputs.last_name = last_name;
  }
  if (email !== undefined) {
    updateFields.push("email=@email");
    inputs.email = email;
  }
  if (mobile_number !== undefined) {
    updateFields.push("mobile_number=@mobile_number");
    inputs.mobile_number = mobile_number;
  }
  if (token !== undefined) {
    updateFields.push("token=@token");
    inputs.token = token;
  }
  if (role !== undefined) {
    updateFields.push("role=@role");
    inputs.role = role;
  }
  if (session_id !== undefined) {
    updateFields.push("session_id=@session_id");
    inputs.session_id = (session_id && uuidValidate(session_id)) ? session_id : uuidv4();
  }
  if (password !== undefined) {
    updateFields.push("password=@password");
    inputs.password = password;
  }

  if (updateFields.length === 0) {
    throw new Error("No fields to update");
  }

  updateFields.push("updated_at=GETDATE()");

  const request = new sql.Request();
  request.input("admin_id", sql.Int, adminId);
  
  // Add inputs dynamically
  Object.keys(inputs).forEach(key => {
    if (key === 'session_id') {
      request.input(key, sql.UniqueIdentifier, inputs[key]);
    } else {
      request.input(key, sql.NVarChar, inputs[key]);
    }
  });

  const query = `UPDATE Admins SET ${updateFields.join(", ")} WHERE admin_id=@admin_id`;
  return await request.query(query);
}

// ✅ Delete admin
async function deleteAdmin(adminId) {
  const request = new sql.Request();
  return await request
    .input("admin_id", sql.Int, adminId)
    .query("DELETE FROM Admins WHERE admin_id=@admin_id");
}

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  findAdminByUsername,
  findAdminByEmail,
  findAdminByMobile,
  updateAdminToken
};
