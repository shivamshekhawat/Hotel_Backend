const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const { pool, poolConnect, sql } = require('../../db');

const ALLOWED_STATUS = ["available", "occupied", "maintenance", "cleaning"];
const ALLOWED_TYPES = ["deluxe", "standard", "suite", "premium"];

// -------------------- Helper: Detect room column name --------------------
async function getRoomColumnName() {
  await poolConnect;
  const result = await pool
    .request()
    .input("table", sql.VarChar, "Rooms")
    .query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA='dbo' 
        AND TABLE_NAME=@table 
        AND COLUMN_NAME IN ('room_id','roomNo')
    `);

  const names = result.recordset.map(row => row.COLUMN_NAME);
  if (names.includes('roomNo')) return 'roomNo';
  if (names.includes('room_id')) return 'room_id';
  throw new Error('Rooms table missing room identifier column (room_id/roomNo)');
}

// -------------------- Helper: format response --------------------
function formatRoom(row, roomColumn) {
  return {
    id: row.room_id || row.roomNo,   // unique identifier
    number: row.roomNo || String(row.room_id),
    type: row.type,
    floor: row.floor,
    status: row.status,
    capacity: row.capacity
  };
}

// -------------------- POST add room --------------------
router.post('/', adminAuth, async (req, res) => {
  try {
    const { roomNo, type, floor, status = 'available', capacity } = req.body;

    if (!roomNo && floor === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: roomNo (if schema uses it) and floor'
      });
    }

    if (type && !ALLOWED_TYPES.includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(", ")}`
      });
    }

    if (status && !ALLOWED_STATUS.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`
      });
    }

    await poolConnect;
    const roomColumn = await getRoomColumnName();

    const request = pool.request()
      .input('type', type)
      .input('floor', floor)
      .input('status', status);

    let insertQuery;

    if (roomColumn === 'roomNo') {
      request.input('room_value', roomNo);
      if (capacity !== undefined && capacity !== null && capacity !== '') {
        request.input('capacity', capacity);
        insertQuery = `
          INSERT INTO Rooms (${roomColumn}, type, floor, status, capacity)
          OUTPUT INSERTED.*
          VALUES (@room_value, @type, @floor, @status, @capacity)
        `;
      } else {
        insertQuery = `
          INSERT INTO Rooms (${roomColumn}, type, floor, status)
          OUTPUT INSERTED.*
          VALUES (@room_value, @type, @floor, @status)
        `;
      }
    } else {
      if (capacity !== undefined && capacity !== null && capacity !== '') {
        request.input('capacity', capacity);
        insertQuery = `
          INSERT INTO Rooms (type, floor, status, capacity)
          OUTPUT INSERTED.*
          VALUES (@type, @floor, @status, @capacity)
        `;
      } else {
        insertQuery = `
          INSERT INTO Rooms (type, floor, status)
          OUTPUT INSERTED.*
          VALUES (@type, @floor, @status)
        `;
      }
    }

    const insert = await request.query(insertQuery);
    const row = insert.recordset[0];

    return res.status(201).json({
      success: true,
      data: formatRoom(row, roomColumn)
    });

  } catch (err) {
    console.error('Rooms POST error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
});

// -------------------- PUT update room --------------------
// -------------------- PUT update room --------------------
// -------------------- PUT update room --------------------
router.put('/:roomId', adminAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, guestName, guestEmail, guestPhone, checkIn, checkOut, specialRequests } = req.body;

    if (!status && !guestName && !guestEmail && !guestPhone && !checkIn && !checkOut && !specialRequests) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    await poolConnect;
    const roomColumn = await getRoomColumnName();
    const request = pool.request();

    // Always update room status
    if (status) {
      request.input('status', status);
      await request.query(`
        UPDATE Rooms
        SET status = @status
        WHERE ${roomColumn} = ${roomId}
      `);
    }

    // If guest info provided → insert booking
    if (guestName || guestEmail || guestPhone || checkIn || checkOut || specialRequests) {
      const bookingReq = pool.request()
        .input('room_id', roomId)
        .input('guestName', guestName || null)
        .input('guestEmail', guestEmail || null)
        .input('guestPhone', guestPhone || null)
        .input('checkIn', checkIn || null)
        .input('checkOut', checkOut || null)
        .input('specialRequests', specialRequests || null);

      const insertBooking = await bookingReq.query(`
        INSERT INTO Bookings (room_id, guestName, guestEmail, guestPhone, checkIn, checkOut, specialRequests)
        OUTPUT INSERTED.*
        VALUES (@room_id, @guestName, @guestEmail, @guestPhone, @checkIn, @checkOut, @specialRequests)
      `);

      return res.json({
        success: true,
        data: {
          id: roomId,
          status,
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          specialRequests
        }
      });
    }

    return res.json({
      success: true,
      data: { id: roomId, status }
    });

  } catch (err) {
    console.error('Rooms PUT error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: err.message
    });
  }
});
;


module.exports = router;
