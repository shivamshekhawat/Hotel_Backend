const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middleware/auth');
const { sendNotification } = require('../../utils/fcmService');

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/logout', authMiddleware, authController.logout); // logout example

// Simple test endpoint to validate an FCM token by sending a test message
router.post('/test-fcm', async (req, res) => {
  try {
    let { fcm_token, message } = req.body || {};
    fcm_token = (fcm_token || '').trim();
    message = (message || 'Test notification from backend').trim();
    if (!fcm_token) return res.status(400).json({ message: 'fcm_token is required' });

    const tokenPreview = `${fcm_token.slice(0, 12)}...${fcm_token.slice(-6)}`;
    console.log(`[FCM] test-fcm called token=${tokenPreview}`);
    const id = await sendNotification(fcm_token, message);
    return res.json({ messageId: id, status: 'sent' });
  } catch (err) {
    console.error('[FCM] test-fcm failed:', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Failed to send test FCM' });
  }
});

module.exports = router;
