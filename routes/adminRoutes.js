const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
// const roomController = require("../controllers/room/roomController");

// Create admin route
router.post("/", adminController.createAdmin);

// Admin login route
router.post("/login", adminController.adminLogin);

// Get all admins route
router.get("/", adminController.getAllAdmins);

// Get admin by ID route
router.get("/:id", adminController.getAdminById);

// Update admin route
router.put("/:id", adminController.updateAdmin);

// Delete admin route
router.delete("/:id", adminController.deleteAdmin);

module.exports = router;
