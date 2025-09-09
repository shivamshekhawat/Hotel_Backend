const express = require('express');
const router = express.Router();
const { sql } = require('../../db');
const auth = require('../../middleware/auth');

// ---- helpers ----
const isBlank = v =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// Validate room_number presence, allow roomNo as alias
const coerceRoomFromBody = (req) => {
  let value = null;

  if (Object.prototype.hasOwnProperty.call(req.body, 'room_number')) {
    value = req.body.room_number;
  } else if (Object.prototype.hasOwnProperty.call(req.body, 'roomNo')) {
    value = req.body.roomNo;
  }

  const asStr = String(value ?? '').trim();
  return { present: !!value, value: asStr.length ? asStr : null };
};

// Format datetime to "DD-MM-YYYY HH:mm:ss"
function formatDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
}

// Validate date/time string in either DD-MM-YYYY HH:mm:ss or YYYY-MM-DD HH:mm:ss
function validateDateTimeString(s) {
  if (typeof s !== 'string') return { ok: false, error: 'Date and time are required.' };
  
  const trimmed = s.trim();
  const parts = trimmed.split(' ');
  const datePart = parts[0] || '';
  const timePart = parts[1] || '';

  const ddmmyyyy = /^\d{2}-\d{2}-\d{4}$/;
  const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePart || (!ddmmyyyy.test(datePart) && !yyyymmdd.test(datePart))) {
    return { ok: false, error: 'Date is required in DD-MM-YYYY or YYYY-MM-DD format.' };
  }

  const timeRe = /^\d{2}:\d{2}:\d{2}$/;
  if (!timePart || !timeRe.test(timePart)) {
    return { ok: false, error: 'Time is required in HH:mm:ss format.' };
  }

  let iso;
  if (ddmmyyyy.test(datePart)) {
    const [dd, mm, yyyy] = datePart.split('-');
    iso = `${mm}/${dd}/${yyyy} ${timePart}`;
  } else {
    const [yyyy, mm, dd] = datePart.split('-');
    iso = `${mm}/${dd}/${yyyy} ${timePart}`;
  }

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { ok: false, error: 'Invalid date or time.' };

  return { ok: true, date: d };
}

// ---- POST /cleanService ---- Create a new request
router.post('/', auth, async (req, res) => {
  try {
    const { message, status, time } = req.body;

    // 1) room_number validation
    const roomFromBody = coerceRoomFromBody(req);
    if (!roomFromBody.present) {
      return res.status(400).json({ message: 'room_number is required.' });
    }
    if (roomFromBody.value === null) {
      return res.status(400).json({ message: 'room_number cannot be empty.' });
    }
    const room_number = roomFromBody.value;

    // 2) message validation
    const cleanMessage = String(message ?? '').trim();
    if (!cleanMessage) return res.status(400).json({ message: 'Message cannot be empty.' });
    if (cleanMessage.length < 3 || cleanMessage.length > 500)
      return res.status(400).json({ message: 'Message must be between 3 and 500 characters.' });
    if (/\.[a-zA-Z0-9]{2,5}$/.test(cleanMessage))
      return res.status(400).json({ message: 'Message must be in valid format.' });

    // 3) status validation
    if (isBlank(status)) return res.status(400).json({ message: 'Status is required.' });
    const cleanStatus = String(status).trim().toUpperCase();
    const allowedStatus = ['REQUESTED', 'IN_PROGRESS', 'CANCELLED'];
    if (!allowedStatus.includes(cleanStatus))
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatus.join(', ')}` });

    // 4) time validation
    if (isBlank(time)) return res.status(400).json({ message: 'Date and time are required.' });
    const validation = validateDateTimeString(String(time));
    if (!validation.ok) return res.status(400).json({ message: validation.error });
    const dt = validation.date;

    // 5) insert into DB
    const result = await sql.query`
      INSERT INTO dbo.CleanRoomServiceRequests (room_number, message, status, request_time)
      OUTPUT INSERTED.request_id, INSERTED.room_number, INSERTED.status, INSERTED.request_time
      VALUES (${room_number}, ${cleanMessage}, ${cleanStatus}, ${dt})
    `;
    const row = result.recordset[0];

    // 6) return response
    return res.status(201).json({
      request_id: row.request_id,
      room_number: row.room_number,
      status: row.status,
      time: formatDateTime(row.request_time),
      message: cleanMessage,
    });
  } catch (err) {
    console.error('❌ Error in POST /cleanService:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// ---- POST /cleanService/get ---- Fetch all requests
router.post('/get', auth, async (req, res) => {
  try {
    const { room_id, check_in_time } = req.body;

    // 1) Validate room_id
    if (!room_id) return res.status(400).json({ message: 'room_id is required.' });

    // 2) Validate check_in_time
    if (!check_in_time || typeof check_in_time !== 'string') {
      return res.status(400).json({ message: 'check_in_time is required.' });
    }
    const dtValidation = validateDateTimeString(check_in_time);
    if (!dtValidation.ok) return res.status(400).json({ message: dtValidation.error });
    const checkInDate = dtValidation.date;

    // 3) Fetch from DB
    const result = await sql.query`
      SELECT request_id, room_number AS room_id, request_time, status
      FROM dbo.CleanRoomServiceRequests
      WHERE room_number = ${room_id} AND request_time >= ${checkInDate}
      ORDER BY request_time ASC
    `;

    // 4) Format time in DD-MM-YYYY HH:mm:ss
    const formatted = (result.recordset || []).map(r => ({
      ...r,
      request_time: formatDateTime(r.request_time),
    }));

    return res.status(200).json(formatted);
  } catch (err) {
    console.error('❌ Error in POST /cleanService/get:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
