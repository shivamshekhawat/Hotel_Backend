const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyApiKey } = require("../middleware/apiKeyMiddleware");
const { verifyAdminToken } = require("../middleware/authMiddleware");

// Debug middleware for all admin routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Admin route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// Create admin route (no auth required)
router.post("/", adminController.createAdmin);

// Admin login route (no auth required)
router.post("/login", adminController.adminLogin);

// Protected routes (require admin token)
router.use(verifyAdminToken);

// Get all admins route
router.get("/", adminController.getAllAdmins);

// Update admin route
router.put("/:id", adminController.updateAdmin);

// Delete admin route
router.delete("/:id", adminController.deleteAdmin);

// Update hotel password route
router.put("/hotel/password/:hotelId", adminController.updateHotelPassword);

// Get hotels for admin
router.get("/hotels", (req, res, next) => {
  console.log('GET /api/admin/hotels route hit');
  adminController.getAdminHotels(req, res, next);
});

module.exports = router;
