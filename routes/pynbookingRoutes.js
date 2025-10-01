const express = require('express');
const router = express.Router();
const pynbookingController = require('../controllers/pynbookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Test endpoint (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: 'PynBooking API is working!' });
});

// Protected routes (require authentication)
router.get('/sync', verifyToken, pynbookingController.syncReservations);
router.get('/room/:roomNumber', verifyToken, pynbookingController.getReservationByRoom);
router.get('/reservations', verifyToken, pynbookingController.getAllReservations);

module.exports = router;
