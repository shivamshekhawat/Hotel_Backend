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

module.exports = { verifyToken };
