const jwt = require('jsonwebtoken');
const { pool, sql } = require('../db'); // single DB used for both users/admins

if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

const jwtSecret = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
    let token = req.headers['authorization']?.split(' ')[1] || req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Optional: enforce token_version revocation
        if (decoded?.id != null) {
            const result = await pool
                .request()
                .input('id', sql.Int, decoded.id)
                .query('SELECT token_version FROM Users WHERE id=@id');

            const dbVersion = result.recordset[0]?.token_version ?? 0;
            if (decoded.token_version !== dbVersion) {
                return res.status(401).json({ message: 'Invalid token.' });
            }
        }

        req.user = decoded; // attach user info to request
        next();
    } catch (err) {
        console.error('JWT verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = auth;
