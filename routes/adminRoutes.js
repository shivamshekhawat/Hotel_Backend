const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyApiKey } = require("../middleware/apiKeyMiddleware");
const { verifyAdminToken } = require("../middleware/authMiddleware");

// Create admin route
router.post("/", adminController.createAdmin);

// Admin login route
router.post("/login", adminController.adminLogin);

// Get all admins route (protected with API key)
router.get("/", verifyApiKey, adminController.getAllAdmins);

// Update admin route - PUT /api/admin/:id
router.put("/:id", verifyAdminToken, adminController.updateAdmin);

// Delete admin route
router.delete("/:id", verifyAdminToken, adminController.deleteAdmin);

// Update hotel password route
router.put("/hotel/password/:hotelId", verifyAdminToken, adminController.updateHotelPassword);

module.exports = router;
