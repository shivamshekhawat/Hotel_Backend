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

/**
 * Send a silent notification (data-only payload) for Android.
 * Silent notifications don't show a visible notification to the user.
 * The app receives the data in the background and can process it silently.
 */
async function sendSilentNotification(fcmToken, data) {
  // Validate inputs
  if (typeof fcmToken !== 'string' || !fcmToken.trim()) {
    throw new Error('FCM token is missing or empty');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Data payload is required for silent notifications');
  }

  const payload = {
    token: fcmToken.trim(),
    data: {
      // Convert all data values to strings (FCM requirement)
      ...Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {})
    },
    android: {
      priority: 'high',
      // This ensures the notification is delivered silently
      data: {
        // Add any additional Android-specific data here
        silent: 'true'
      }
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'background'
      },
      payload: {
        aps: {
          'content-available': 1
        }
      }
    }
  };

  return admin.messaging().send(payload);
}

/**
 * Send silent notification to multiple devices
 */
async function sendSilentNotificationToMultiple(tokens, data) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    throw new Error('Tokens array is required and cannot be empty');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Data payload is required for silent notifications');
  }

  const payload = {
    tokens: tokens,
    data: {
      ...Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {})
    },
    android: {
      priority: 'high',
      data: {
        silent: 'true'
      }
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'background'
      },
      payload: {
        aps: {
          'content-available': 1
        }
      }
    }
  };

  return admin.messaging().sendMulticast(payload);
}

module.exports = { 
  sendNotification, 
  sendSilentNotification, 
  sendSilentNotificationToMultiple 
};
