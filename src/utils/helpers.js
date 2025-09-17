const bcrypt = require('bcryptjs');

/**
 * Hash a password using bcrypt
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} True if passwords match
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random string of specified length
 * @param {Number} length - Length of the random string
 * @returns {String} Random string
 */
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format date to ISO string
 * @param {Date} date - Date to format
 * @returns {String} ISO formatted date string
 */
function formatDate(date) {
  return new Date(date).toISOString();
}

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input
 * @param {String} input - String to sanitize
 * @returns {String} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate room access code
 * @param {Number} roomNumber - Room number
 * @returns {String} Access code
 */
function generateRoomAccessCode(roomNumber) {
  const timestamp = Date.now().toString().slice(-4);
  return `${roomNumber}${timestamp}`;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomString,
  formatDate,
  isValidEmail,
  sanitizeString,
  generateRoomAccessCode
};
