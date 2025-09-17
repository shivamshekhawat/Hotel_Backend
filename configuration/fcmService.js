// utils/fcmService.js
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'firebaseAdminSDK.json'));

// Prevent double-initialization during nodemon reloads
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Send a single-device notification.
 * Returns a promise; rejects with a clear Error if token/message is invalid.
 */
async function sendNotification(fcmToken, message) {
  // Validate inputs
  if (typeof fcmToken !== 'string' || !fcmToken.trim()) {
    throw new Error('FCM token is missing or empty');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Notification message is missing or empty');
  }

  const payload = {
    token: fcmToken.trim(),             // exactly one of token/topic/condition
    notification: {
      title: 'Live Update',
      body: message.trim(),
    },
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  };

  // Let caller decide how to handle errors
  return admin.messaging().send(payload);
}

module.exports = { sendNotification };
