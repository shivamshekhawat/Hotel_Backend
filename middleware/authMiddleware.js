const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { getAdminById } = require("../models/adminModel");

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
async function verifyAdminToken(req, res, next) {
  console.log('Verifying admin token...');
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    console.error('No token provided');
    return res.status(403).json({ 
      success: false,
      message: "Access denied. No token provided." 
    });
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Check for admin role
    if (decoded.role !== 'admin') {
      console.error('Access denied. Admin role required.');
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin role required." 
      });
    }

    // Ensure either userId or adminId is included in the token
    const userId = decoded.userId || decoded.adminId;
    if (!userId) {
      console.error('Invalid token: User ID or Admin ID missing');
      return res.status(401).json({ 
        success: false,
        message: "Invalid token: User ID or Admin ID missing" 
      });
    }
    
    // Add the userId to the decoded object for consistent access
    decoded.userId = userId;

    try {
      // Get admin details from database to get the username
      const admin = await getAdminById(userId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Attach decoded payload to request
      req.admin = {
        ...decoded,
        userId: decoded.userId,
        username: admin.username
      };
      
      console.log('Admin token verified for userId:', req.admin.userId);
    } catch (error) {
      console.error('Error fetching admin details:', error);
      return res.status(401).json({ 
        success: false,
        message: "Error verifying admin credentials" 
      });
    }
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    let errorMessage = 'Invalid or expired token';
    
    if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    }
    
    return res.status(401).json({ 
      success: false,
      message: errorMessage 
    });
  }
}

module.exports = { 
  verifyToken, 
  verifyAdminToken: async (req, res, next) => {
    try {
      await verifyAdminToken(req, res, next);
    } catch (error) {
      console.error('Error in verifyAdminToken:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during token verification' 
      });
    }
  }
};
