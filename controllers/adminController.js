const adminModel = require("../models/adminModel");
const hotelModel = require("../models/hotelModel");
const { verifyAdminToken } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../configuration/tokenGenerator");

// ---------------- Validation helpers ----------------
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidMobile = (mobile) => /^[0-9]{10,15}$/.test(mobile);
const isValidPassword = (password) => password && password.length >= 6;
const isValidName = (name) => name && name.trim().length >= 2 && name.trim().length <= 50;
const isValidUsername = (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username);

// ---------------- Create Admin ----------------
const createAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, mobile_number, username, password, session_id } = req.body;

    // Check required fields
    const missingFields = ["first_name", "last_name", "email", "mobile_number", "username", "password"]
      .filter(f => !req.body[f] || req.body[f].toString().trim() === "");
    if (missingFields.length > 0)
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });

    // Validate input
    if (!isValidName(first_name)) return res.status(400).json({ error: "First name must be 2-50 characters" });
    if (!isValidName(last_name)) return res.status(400).json({ error: "Last name must be 2-50 characters" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });
    if (!isValidMobile(mobile_number)) return res.status(400).json({ error: "Mobile number must be 10-15 digits" });
    if (!isValidUsername(username)) return res.status(400).json({ error: "Username must be 3-20 characters" });
    if (!isValidPassword(password)) return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Check duplicates
    if (await adminModel.findAdminByUsername(username)) return res.status(400).json({ error: "Username already exists" });
    if (await adminModel.findAdminByEmail(email)) return res.status(400).json({ error: "Email already exists" });
    if (await adminModel.findAdminByMobile(mobile_number)) return res.status(400).json({ error: "Mobile number already exists" });

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const adminData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      mobile_number: mobile_number.trim(),
      username: username.trim(),
      password: password,
      role: "admin",
      session_id: session_id || null,
      token: ""
    };

    // Create admin
    const result = await adminModel.createAdmin(adminData);
    console.log("Create admin result:", result); // Debug log
    
    const adminId = result?.admin_id;
    if (!adminId) {
      console.error("No admin_id returned from createAdmin:", result);
      throw new Error("Failed to create admin - no admin_id returned");
    }

    // Get full admin data
    const newAdmin = await adminModel.getAdminById(adminId);
    if (!newAdmin) {
      console.error("Failed to retrieve created admin with ID:", adminId);
      throw new Error("Admin created but failed to retrieve");
    }

    // Generate token and try to persist; don't fail request if DB token write fails
    const token = generateToken({ userId: adminId, role: "admin", session_id: newAdmin.session_id });
    try {
      await adminModel.updateAdminToken(adminId, token);
    } catch (tokenErr) {
      console.error("Failed to persist token (returning success anyway):", tokenErr);
    }

    res.status(201).json({
      message: "Admin created successfully",
      admin: newAdmin,
      token,
      admin_id: adminId
    });

  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: "Unable to create admin" });
  }
};

// ---------------- Admin Login ----------------
const adminLogin = async (req, res) => {
  try {
    // 1️⃣ Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "Request body is required. Send JSON with Content-Type: application/json",
      });
    }

    // 2️⃣ Destructure input
    const { username, password, session_id } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // 3️⃣ Find admin by username
    const admin = await adminModel.findAdminByUsername(username);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    // 4️⃣ Compare plain-text password
    if (password !== admin.password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 5️⃣ Generate token with admin_id and role
    const tokenPayload = {
      admin_id: admin.admin_id,
      role: "admin",
      email: admin.email,
      username: admin.username,
      session_id: session_id || null,
    };
    
    console.log('Generating token with payload:', tokenPayload);
    const token = generateToken(tokenPayload);

    // 6️⃣ Update token in DB
    await adminModel.updateAdminToken(admin.admin_id, token);

    // 7️⃣ Prepare response data (exclude password)
    const { password: _, ...adminData } = admin;
    console.log("Admin login successful for:", adminData);
    
    // 8️⃣ Return success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: adminData,
        token,
        session_id: session_id || null,
      }
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
    res.json({ message: "Admins retrieved successfully", count: admins.length, admins });
  } catch (err) {
    console.error("Get all admins error:", err);
    res.status(500).json({ error: "Unable to get all admins" });
  }
};



// ---------------- Update Admin ----------------
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = parseInt(id, 10);
    
    // Check if adminId is a valid number
    if (isNaN(adminId)) {
      return res.status(400).json({ error: "Invalid admin ID" });
    }

    const { firstName, lastName, email, phone } = req.body;

    // Validate that all required fields are provided
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ 
        error: "All fields are required: firstName, lastName, email, phone" 
      });
    }

    // Validate field formats
    if (!isValidName(firstName)) {
      return res.status(400).json({ error: "First name must be 2-50 characters" });
    }
    if (!isValidName(lastName)) {
      return res.status(400).json({ error: "Last name must be 2-50 characters" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!isValidMobile(phone)) {
      return res.status(400).json({ error: "Phone number must be 10-15 digits" });
    }

    // Check if admin exists
    const existingAdmin = await adminModel.getAdminById(adminId);
    if (!existingAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Check if the phone number is being changed
    if (phone !== existingAdmin.mobile_number) {
      // Check if the new phone number is already in use by another admin
      const adminWithSamePhone = await adminModel.findAdminByMobile(phone);
      if (adminWithSamePhone && adminWithSamePhone.admin_id !== adminId) {
        return res.status(400).json({ 
          error: "Phone number is already in use by another admin" 
        });
      }
    }

    // Check if the email is being changed
    if (email.toLowerCase() !== existingAdmin.email.toLowerCase()) {
      // Check if the new email is already in use by another admin
      const adminWithSameEmail = await adminModel.findAdminByEmail(email);
      if (adminWithSameEmail && adminWithSameEmail.admin_id !== adminId) {
        return res.status(400).json({ 
          error: "Email is already in use by another admin" 
        });
      }
    }

    // Update admin with mapped field names
    const updateData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.toLowerCase().trim(),
      mobile_number: phone.trim(),
      username: existingAdmin.username,  // Include the existing username
      role: existingAdmin.role 
    };

    await adminModel.updateAdmin(adminId, updateData);
    
    // Get updated admin details
    const updatedAdmin = await adminModel.getAdminById(adminId);
    
    res.json({ 
      message: "Admin updated successfully",
      admin: {
        id: updatedAdmin.admin_id,
        firstName: updatedAdmin.first_name,
        lastName: updatedAdmin.last_name,
        email: updatedAdmin.email,
        phone: updatedAdmin.mobile_number,
        username: updatedAdmin.username
      }
    });
  } catch (err) {
    console.error("Update admin error:", err);
    
    // Handle specific error cases
    if (err.number === 2627) {
      // SQL Server unique constraint violation
      if (err.message.includes('UQ__Admins__30462B0F9219231B')) {
        return res.status(400).json({ error: "Phone number is already in use" });
      } else if (err.message.includes('UQ__Admins__A9D10534')) {
        return res.status(400).json({ error: "Email is already in use" });
      } else if (err.message.includes('UQ__Admins__F3DBC572')) {
        return res.status(400).json({ error: "Username is already in use" });
      }
    }
    
    res.status(500).json({ 
      error: "An error occurred while updating the admin" 
    });
  }
};

// ---------------- Delete Admin ----------------
const deleteAdmin = async (req, res) => {
  try {
    const existingAdmin = await adminModel.getAdminById(req.params.id);
    if (!existingAdmin) return res.status(404).json({ error: "Admin not found" });

    await adminModel.deleteAdmin(req.params.id);
    res.json({ message: "Admin deleted successfully", admin_id: req.params.id });

  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- Update Hotel Password ----------------
const updateHotelPassword = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hotel = await hotelModel.getHotelById(hotelId);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    await hotelModel.updatePassword(hotelId, newPassword);

    res.json({ message: "Hotel password updated successfully", hotel_id: hotelId });

  } catch (err) {
    console.error("Update hotel password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get hotels for the currently logged-in admin
 * @route GET /api/admin/hotels
 * @access Private (Admin only)
 */
const getAdminHotels = async (req, res) => {
  try {
    // Get admin username from the token (set by verifyAdminToken middleware)
    const username = req.admin.username;
    
    console.log('Admin username from token:', username); // Debug log
    console.log('Request admin object:', req.admin); // Debug log

    if (!username) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Username not found in token',
        receivedToken: req.admin // For debugging
      });
    }

    // Get hotels for this admin
    const hotels = await hotelModel.getHotelsByAdminId(username);
    console.log('Hotels from DB:', hotels); // Debug log

    // Format the response to match the required format
    const adminId = req.admin.userId; // Get admin ID from the authenticated request
    const formattedHotels = hotels.map(hotel => ({
      hotel_id: hotel.hotel_id,
      name: hotel.name,
      logo_url: hotel.logo_url || '',
      established_year: hotel.established_year || new Date().getFullYear(),
      address: hotel.address || '',
      service_care_no: hotel.service_care_no || '',
      city: hotel.city || '',
      country: hotel.country || '',
      postal_code: hotel.postal_code || '',
      username: hotel.username || '',
      admin_id: hotel.admin_id || adminId // Use the admin ID from the request
    }));

    res.status(200).json({
      success: true,
      count: formattedHotels.length,
      data: formattedHotels
    });

  } catch (error) {
    console.error('Error in getAdminHotels:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching admin hotels',
      details: error.message // Include error details for debugging
    });
  }
};

module.exports = {
  createAdmin,
  adminLogin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  updateHotelPassword,
  getAdminHotels
};
