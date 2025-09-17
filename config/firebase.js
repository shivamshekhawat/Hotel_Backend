const admin = require('firebase-admin');
const path = require('path');

// Prevent double-initialization during nodemon reloads
if (!admin.apps.length) {
  try {
    const serviceAccount = require(path.join(__dirname, 'firebaseAdminSDK.json'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.warn('⚠️ Firebase Admin SDK not initialized:', error.message);
  }
}

/**
 * Send a single-device notification.
 * @param {String} fcmToken - FCM token of the target device
 * @param {String} message - Notification message
 * @param {String} title - Notification title (optional)
 * @returns {Promise} Firebase messaging result
 */
async function sendNotification(fcmToken, message, title = 'Live Update') {
  // Validate inputs
  if (typeof fcmToken !== 'string' || !fcmToken.trim()) {
    throw new Error('FCM token is missing or empty');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Notification message is missing or empty');
  }

  const payload = {
    token: fcmToken.trim(),
    notification: {
      title: title.trim(),
      body: message.trim(),
    },
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  };

  return admin.messaging().send(payload);
}

/**
 * Send notification to multiple devices
 * @param {Array} fcmTokens - Array of FCM tokens
 * @param {String} message - Notification message
 * @param {String} title - Notification title (optional)
 * @returns {Promise} Firebase messaging result
 */
async function sendMulticastNotification(fcmTokens, message, title = 'Live Update') {
  if (!Array.isArray(fcmTokens) || fcmTokens.length === 0) {
    throw new Error('FCM tokens array is missing or empty');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Notification message is missing or empty');
  }

  const payload = {
    tokens: fcmTokens,
    notification: {
      title: title.trim(),
      body: message.trim(),
    },
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  };

  return admin.messaging().sendMulticast(payload);
}

module.exports = {
  sendNotification,
  sendMulticastNotification,
  admin
};
