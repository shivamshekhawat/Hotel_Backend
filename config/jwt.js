const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "3153600000s"; // Token expiry time

/**
 * Generate a JWT token
 * @param {Object} payload - Data to put inside token (e.g. userId, role)
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
