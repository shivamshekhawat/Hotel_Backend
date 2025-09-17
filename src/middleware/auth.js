const { verifyToken } = require('../../config/jwt');
const logger = require('../utils/logger');

// In-memory cache for tracking used tokens
const seenTokens = new Set();

/**
 * Middleware: Verify JWT token + optional one-time use check
 */
function verifyAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    return res.status(403).json({ 
      error: "Access denied", 
      message: "Token required" 
    });
  }

  try {
    const decoded = verifyToken(token);

    // Attach decoded payload to request
    req.hotel = decoded; // example: req.hotel.hotel_id

    // Check if token has been used before (optional security feature)
    if (seenTokens.has(token)) {
      logger.debug('Token already used once', { 
        hotel_id: decoded.hotel_id,
        token: token.substring(0, 10) + '...'
      });
      return next();
    }

    // First time seeing this token
    seenTokens.add(token);
    logger.info('Authentication successful', { 
      hotel_id: decoded.hotel_id,
      token: token.substring(0, 10) + '...'
    });

    next();
  } catch (err) {
    logger.error('Authentication failed: Invalid token', {
      error: err.message,
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    return res.status(401).json({ 
      error: "Authentication failed", 
      message: "Invalid or expired token" 
    });
  }
}

/**
 * Middleware: Check if user has admin privileges
 */
function requireAdmin(req, res, next) {
  if (!req.hotel || req.hotel.role !== 'admin') {
    logger.warn('Admin access denied', {
      hotel_id: req.hotel?.hotel_id,
      ip: req.ip,
      url: req.url
    });
    return res.status(403).json({ 
      error: "Access denied", 
      message: "Admin privileges required" 
    });
  }
  next();
}

/**
 * Middleware: Check if user owns the resource
 */
function checkResourceOwnership(req, res, next) {
  const resourceHotelId = req.params.hotel_id || req.body.hotel_id;
  
  if (req.hotel.hotel_id !== parseInt(resourceHotelId)) {
    logger.warn('Resource ownership check failed', {
      user_hotel_id: req.hotel.hotel_id,
      resource_hotel_id: resourceHotelId,
      ip: req.ip,
      url: req.url
    });
    return res.status(403).json({ 
      error: "Access denied", 
      message: "You can only access your own resources" 
    });
  }
  next();
}

module.exports = {
  verifyAuth,
  requireAdmin,
  checkResourceOwnership
};
