const adminModel = require("../models/adminModel");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../configuration/tokenGenerator");

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10,15}$/;
  return mobileRegex.test(mobile);
};

const isValidPassword = (password) => {
  return password && password.length >= 6;
};

const isValidName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// ---------------- Create Admin ----------------
const createAdmin = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile_number,
      username,
      password,
      session_id
    } = req.body;

    // Required fields validation
    const requiredFields = {
      first_name,
      last_name,
      email,
      mobile_number,
      username,
      password
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.toString().trim() === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required field(s): ${missingFields.join(", ")}` });
    }

    // Field format validation
    if (!isValidName(first_name)) {
      return res.status(400).json({ error: "First name must be 2-50 characters" });
    }

    if (!isValidName(last_name)) {
      return res.status(400).json({ error: "Last name must be 2-50 characters" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!isValidMobile(mobile_number)) {
      return res.status(400).json({ error: "Mobile number must be 10-15 digits" });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: "Username must be 3-20 characters (letters, numbers, underscore only)" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check for existing admin with same username, email, or mobile
    const existingUsername = await adminModel.findAdminByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: "Admin with this username already exists" });
    }

    const existingEmail = await adminModel.findAdminByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    const existingMobile = await adminModel.findAdminByMobile(mobile_number);
    if (existingMobile) {
      return res.status(400).json({ error: "Admin with this mobile number already exists" });
    }

    const adminData = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.toLowerCase().trim(),
        mobile_number: mobile_number.trim(),
        token: "",
        role: "admin",
        session_id: session_id || null,
        username: username.trim(),
        password: hashedPassword
      };
    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);
    const result = await adminModel.createAdmin(adminData);

    // Generate token
    const token = generateToken({ 
      userId: result.recordset[0]?.admin_id, 
      role: "admin",
      session_id: session_id || null 
    });

    adminData.token = token;

    // Prepare admin data
    // const adminData1 = {
    //   first_name: first_name.trim(),
    //   last_name: last_name.trim(),
    //   email: email.toLowerCase().trim(),
    //   mobile_number: mobile_number.trim(),
    //   token: token,
    //   role: "admin",
    //   session_id: session_id || null,
    //   username: username.trim(),
    //   password: hashedPassword
    // };

    // Create admin
    const result1 = await adminModel.updateAdmin(adminData.admin_id, adminData);

    res.status(201).json({
      message: "Admin created successfully",
      admin_id: result1.recordset[0]?.admin_id,
      username: username,
      email: email,
      role: "admin"
    });

  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: "Unable to create admin" });
  }
};

// ---------------- Admin Login ----------------
const adminLogin = async (req, res) => {
  try {
    const { username, password, session_id } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find admin by username
    const admin = await adminModel.findAdminByUsername(username);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // Generate new token
    const token = generateToken({ 
      userId: admin.admin_id,
      role: "admin",
      session_id: session_id || null 
    });

    // Update admin token
    await adminModel.updateAdminToken(admin.admin_id, token);

    res.json({
      message: "Login successful",
      admin_id: admin.admin_id,
      username: admin.username,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      role: admin.role,
      token: token,
      session_id: session_id || null
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Unable to login admin" });
  }
};

// ---------------- Get All Admins ----------------
const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.getAllAdmins();
    res.json({
      message: "Admins retrieved successfully",
      count: admins.length,
      admins: admins
    });
  } catch (err) {
    console.error("Get all admins error:", err);
    res.status(500).json({ error: "Unable to get all admins" });
  }
};

// ---------------- Get Admin by ID ----------------
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await adminModel.getAdminById(id);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      message: "Admin retrieved successfully",
      admin: admin
    });
  } catch (err) {
    console.error("Get admin by ID error:", err);
    res.status(500).json({ error: "unable to get admin by id" });
  }
};

// ---------------- Update Admin ----------------
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if admin exists
    const existingAdmin = await adminModel.getAdminById(id);
    if (!existingAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Validate email if provided
    if (updateData.email && !isValidEmail(updateData.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate mobile if provided
    if (updateData.mobile_number && !isValidMobile(updateData.mobile_number)) {
      return res.status(400).json({ error: "Mobile number must be 10-15 digits" });
    }

    // Check for duplicate email if email is being updated
    if (updateData.email && updateData.email !== existingAdmin.email) {
      const existingEmail = await adminModel.findAdminByEmail(updateData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Admin with this email already exists" });
      }
    }

    // Check for duplicate mobile if mobile is being updated
    if (updateData.mobile_number && updateData.mobile_number !== existingAdmin.mobile_number) {
      const existingMobile = await adminModel.findAdminByMobile(updateData.mobile_number);
      if (existingMobile) {
        return res.status(400).json({ error: "Admin with this mobile number already exists" });
      }
    }

    // Hash password if provided
    if (updateData.password) {
      if (!isValidPassword(updateData.password)) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update admin
    await adminModel.updateAdmin(id, updateData);

    res.json({
      message: "Admin updated successfully",
      admin_id: id
    });

  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- Delete Admin ----------------
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if admin exists
    const existingAdmin = await adminModel.getAdminById(id);
    if (!existingAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Delete admin
    await adminModel.deleteAdmin(id);

    res.json({
      message: "Admin deleted successfully",
      admin_id: id
    });

  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createAdmin,
  adminLogin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};
