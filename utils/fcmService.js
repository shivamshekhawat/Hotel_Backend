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
 * Send FCM data-only message
 * @param {string} fcmToken - Device FCM token
 * @param {object} dataPayload - Key-value pairs to send
 */
async function sendNotification(fcmToken, dataPayload) {
  // Validate inputs
  if (typeof fcmToken !== 'string' || !fcmToken.trim()) {
    throw new Error('FCM token is missing or empty');
  }
  if (typeof dataPayload !== 'object' || !dataPayload) {
    throw new Error('Data payload is missing or empty');
  }

  const payload = {
    token: fcmToken.trim(),
    data: dataPayload,            // only send data
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  };

  return admin.messaging().send(payload);
}

module.exports = { sendNotification };
