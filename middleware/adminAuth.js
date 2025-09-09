const jwt = require('jsonwebtoken');
const { pool, sql } = require('../db'); // single DB for both users & admins

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

const jwtSecret = process.env.JWT_SECRET;

const adminAuth = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, error: 'Access denied' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) return res.status(401).json({ success: false, error: 'Access denied' });

    // 2. Verify JWT
    const decoded = jwt.verify(token, jwtSecret);

    // 3. Check role
    if (decoded.role !== 'Administrator') {
      return res.status(403).json({ success: false, error: 'Admins only' });
    }

    // 4. Optional: check token_version from DB (skip if you don’t use it yet)
    // const result = await pool
    //   .request()
    //   .input('id', sql.Int, decoded.id)
    //   .query("SELECT token_version FROM Users WHERE id=@id AND role='Administrator'");
    // const dbVersion = result.recordset[0]?.token_version ?? 0;
    // if (decoded.token_version !== dbVersion) {
    //   return res.status(401).json({ success: false, error: 'Invalid token.' });
    // }

    // 5. Attach admin info
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Admin JWT verification failed:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }

    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = adminAuth;
