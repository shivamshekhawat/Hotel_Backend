const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Public routes
router.post('/admin/login', staffController.adminLogin);

// Protected routes (in a real app, add authentication middleware here)
router.get('/staff', staffController.getAllStaff);
router.post('/staff', staffController.createStaff);
router.put('/staff/:id', staffController.updateStaff);
router.delete('/staff/:id', staffController.deleteStaff);
router.get('/staff/me', staffController.getMyProfile);

module.exports = router;
