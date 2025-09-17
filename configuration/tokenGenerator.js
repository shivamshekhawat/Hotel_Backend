import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
const JWT_EXPIRES_IN = JWT_EXPIRES_IN  || "3153600000s"; // Token expiry time
/**
 * Generate a JWT token
 * @param {Object} payload - Data to put inside token (e.g. userId, role)
 * @returns {String} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
