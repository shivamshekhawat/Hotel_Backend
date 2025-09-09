const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../db'); // use your pool from db.js

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const errors = [];
  if (!username || username.trim() === '') errors.push('Username');
  if (!password || password.trim() === '') errors.push('Password');

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: `${errors.join(' and ')} required` 
    });
  }

  try {
    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM Admins WHERE username = @username');

    const admin = result.recordset[0];

    if (!admin || admin.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'Administrator' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      user: {
        username: admin.username,
        email: admin.email,
        role: 'Administrator',
        accessScope: 'full'
      },
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


module.exports = router;
