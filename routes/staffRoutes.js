const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Public routes
router.post('/admin/login', staffController.adminLogin);

// Protected routes (in a real app, add authentication middleware here)
router.get('/', staffController.getAllStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);
router.get('/me', staffController.getMyProfile);

module.exports = router;