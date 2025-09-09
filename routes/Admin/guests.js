const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const { pool, poolConnect, sql } = require('../../db');
const dayjs = require('dayjs');

// -------------------- Helper: format datetime --------------------
function formatDateTime(dt) {
  if (!dt) return null;
  const parsed = dayjs(dt);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : null;
}

// -------------------- GET guests --------------------
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;

    await poolConnect;
    const request = pool.request();

    let query = `
      SELECT g.id, g.name, g.guestEmail, g.guestPhone,
             g.room_id,                 -- use directly
             g.checkIn, g.checkOut, g.specialRequests, g.status
      FROM Guests g
      WHERE 1=1
    `;

    if (status) {
      query += ' AND g.status = @status';
      request.input('status', sql.NVarChar, status);
    }

    if (search) {
      query += ' AND g.name LIKE @search';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);

    const guests = result.recordset.map(g => ({
      id: g.id,
      name: g.name,
      guestEmail: g.guestEmail,
      guestPhone: g.guestPhone,
      room_id: g.room_id, // ✅ will show 101
      checkIn: formatDateTime(g.checkIn),
      checkOut: formatDateTime(g.checkOut),
      specialRequests: g.specialRequests,
      status: g.status
    }));

    res.json({ success: true, data: guests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

// -------------------- POST add guest --------------------
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      email,        // frontend sends `email`
      phone,        // frontend sends `phone`
      room,         // frontend sends `room`
      checkIn,
      checkOut,
      specialRequests,
      status
    } = req.body;

    await poolConnect;
    const request = pool.request()
      .input('name', sql.NVarChar, name)
      .input('guestEmail', sql.NVarChar, email)
      .input('guestPhone', sql.NVarChar, phone)
      .input('room_id', sql.Int, room) // ✅ stores 101
      .input('checkIn', sql.DateTime, checkIn)
      .input('checkOut', sql.DateTime, checkOut)
      .input('specialRequests', sql.NVarChar, specialRequests)
      .input('status', sql.NVarChar, status || 'checked-in');

    const result = await request.query(`
      INSERT INTO Guests (name, guestEmail, guestPhone, room_id, checkIn, checkOut, specialRequests, status)
      OUTPUT INSERTED.*
      VALUES (@name, @guestEmail, @guestPhone, @room_id, @checkIn, @checkOut, @specialRequests, @status)
    `);

    const g = result.recordset[0];
    const guest = {
      id: g.id,
      name: g.name,
      email: g.guestEmail,
      phone: g.guestPhone,
      room_id: g.room_id, // ✅ will return 101
      checkIn: formatDateTime(g.checkIn),
      checkOut: formatDateTime(g.checkOut),
      specialRequests: g.specialRequests,
      status: g.status
    };

    res.status(201).json({ success: true, data: guest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

// -------------------- PUT update guest --------------------
// -------------------- GET single guest --------------------
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT g.id, g.name, g.guestEmail, g.guestPhone,
               g.room_id, g.checkIn, g.checkOut, g.specialRequests, g.status
        FROM Guests g
        WHERE g.id = @id
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    const g = result.recordset[0];
    const guest = {
      id: g.id,
      name: g.name,
      email: g.guestEmail,
      phone: g.guestPhone,
      room_id: g.room_id,
      checkIn: formatDateTime(g.checkIn),
      checkOut: formatDateTime(g.checkOut),
      specialRequests: g.specialRequests,
      status: g.status
    };

    res.json({ success: true, data: guest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

// -------------------- DELETE guest --------------------
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await poolConnect;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Guests
        OUTPUT DELETED.*
        WHERE id = @id
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    res.json({ success: true, message: 'Guest deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

module.exports = router;
