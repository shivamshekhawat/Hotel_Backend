const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyApiKey } = require("../middleware/apiKeyMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");
// const roomController = require("../controllers/room/roomController");

// Create admin route
router.post("/", adminController.createAdmin);

// Admin login route
router.post("/login", adminController.adminLogin);

// Get all admins route (protected with API key)
router.get("/", verifyApiKey, adminController.getAllAdmins);



// Update admin route
router.put("/:id",verifyToken, adminController.updateAdmin);

// Delete admin route
router.delete("/:id",verifyToken, adminController.deleteAdmin);

module.exports = router;
