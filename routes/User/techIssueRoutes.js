const express = require("express");
const router = express.Router();
const { sql } = require("../../db");
const auth = require('../../middleware/auth');

const MAX_ISSUE_LENGTH = 120;

// ---- Helper: format datetime ----
function formatDateTime(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// ---- Helper: extract room from token ----
function getCallerRoom(req) {
  const user = req.user || {};
  const possible = [
    user.room_id,
    user.room_number,
    user.room,
    Array.isArray(user.rooms) ? user.rooms[0] : undefined,
  ].filter(v => v !== undefined && v !== null);
  if (!possible.length) throw new Error('Missing room_id in token');
  return possible[0];
}

// ---- Helper: validate datetime string ----
function validateDateTimeString(s) {
  if (typeof s !== 'string') {
    return { ok: false, error: "Field 'time' is required." };
  }
  const trimmed = s.trim();
  if (!trimmed) {
    return { ok: false, error: "Field 'time' is required." };
  }

  const parts = trimmed.split(' ');
  const datePart = parts[0] || '';
  const timePart = parts[1] || '';

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePart || !dateRe.test(datePart)) {
    return { ok: false, error: "Field 'date' is required." };
  }

  const timeRe = /^\d{2}:\d{2}:\d{2}$/;
  if (!timePart || !timeRe.test(timePart)) {
    return { ok: false, error: "Field 'time' is required." };
  }

  const iso = `${datePart}T${timePart}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid 'time' format." };
  }

  return { ok: true, date: d };
}

// ---- POST Submit Technical Issue ----
// ---- POST Submit Technical Issue ----
router.post("/", auth, async (req, res) => {
  try {
    let { issue, time } = req.body;

    // 1) Validate issue
    if (!issue || !issue.trim()) {
      return res.status(400).json({
        message: "'issue' is required and cannot be empty."
      });
    }

    issue = issue.trim();

    // Check allowed characters (letters, numbers, spaces, basic punctuation)
    const allowedPattern = /^[a-zA-Z0-9\s.,!?'"()-]*$/;
    if (!allowedPattern.test(issue)) {
      return res.status(400).json({
        message: "'issue' contains invalid characters."
      });
    }

    // Max length check
    if (issue.length > MAX_ISSUE_LENGTH) {
      return res.status(400).json({
        message: "'issue' cannot exceed 120 characters."
      });
    }

    // 2) Validate room from token
    const tokenRoom = getCallerRoom(req);
    if (req.body.room_id !== undefined && String(req.body.room_id) !== String(tokenRoom)) {
      return res.status(403).json({
        message: "'room_id' does not match token room."
      });
    }

    // 3) Validate time string
    const validation = validateDateTimeString(String(time || ''));
    if (!validation.ok) {
      return res.status(400).json({
        message: validation.error.replace("Field ", "")
      });
    }
    const dt = validation.date;

    // 4) Insert into DB
    const result = await sql.query`
      INSERT INTO TechnicalIssues (room_id, issue, time)
      OUTPUT INSERTED.issue_id, INSERTED.time
      VALUES (${tokenRoom}, ${issue}, ${dt});
    `;

    const row = result.recordset[0];

    // 5) Success response
    res.status(200).json({
      issue_id: row.issue_id,
      room_id: tokenRoom,
      time: formatDateTime(row.time),
      status: "Success",
      message: "Your technical issue has been reported and a technician will be dispatched."
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
