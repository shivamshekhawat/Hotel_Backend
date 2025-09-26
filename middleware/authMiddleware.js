const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// In-memory cache for tracking used tokens
const seenTokens = new Set();

/**
 * Middleware: Verify JWT token + optional one-time use check
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(403).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded payload to request
    console.log("Decoded token:", decoded);

    if ( decoded.role !== 'admin' && !decoded.hotel_id ) {
      return res.status(401).json({ message: "Invalid token: hotel_id missing" });
    }
    req.hotel = decoded; // example: req.hotel.hotel_id

    // Check if token has been used before
    if (seenTokens.has(token)) {
      console.log(" Token already used once → bypass filter");
      return next();
    }

    // First time seeing this token
    seenTokens.add(token);
    console.log(" First time token → passed filter");

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Middleware: Verify JWT token for Admin
 */
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(403).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check for admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    // Attach decoded payload to request
    req.admin = decoded; // example: req.admin.userId

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { verifyToken, verifyAdminToken };
