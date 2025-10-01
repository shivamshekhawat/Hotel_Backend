const { sql } = require("../db");

// Helper: format Date as "YYYY-MM-DD HH:mm:ss"
function formatDate(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    date.getFullYear() +
    "-" + pad(date.getMonth() + 1) +
    "-" + pad(date.getDate()) +
    " " + pad(date.getHours()) +
    ":" + pad(date.getMinutes()) +
    ":" + pad(date.getSeconds())
  );
}

// ✅ Check if feedback already exists for reservation_id
async function getFeedbackByReservationId(reservation_id) {
  const request = new sql.Request();
  const result = await request
    .input("reservation_id", sql.Int, reservation_id)
    .query("SELECT * FROM Feedback WHERE reservation_id=@reservation_id");

  return result.recordset[0] || null;
}

// ✅ Create feedback (only if not exists)
async function createFeedback(data) {
  const { reservation_id, comments, rating } = data;
  if (!reservation_id) throw new Error("reservation_id is required");

  // check duplicate
  const existing = await getFeedbackByReservationId(reservation_id);
  if (existing) {
    throw new Error("Feedback already submitted for this reservation.");
  }

  const now = new Date();
  const request = new sql.Request();

  const result = await request
    .input("reservation_id", sql.Int, reservation_id)
    .input("comments", sql.NVarChar, comments || "")
    .input("rating", sql.Int, rating || 0)
    .input("submitted_time", sql.DateTime, now)
    .query(`
      INSERT INTO Feedback (reservation_id, comments, rating, submitted_time)
      OUTPUT inserted.*
      VALUES (@reservation_id, @comments, @rating, @submitted_time)
    `);
  const inserted = result.recordset[0];
  inserted.submitted_time = formatDate(inserted.submitted_time);
  return inserted;
}

// ✅ Get all feedback with optional hotel filtering
// @param {number} [hotelId] - Optional hotel ID to filter feedback
async function getAllFeedback(hotelId = null) {
  try {
    const request = new sql.Request();
    
    let query = `
      SELECT 
        f.feedback_id, f.reservation_id, f.comments, f.rating, f.submitted_time,
        r.check_in_time, r.check_out_time,
        g.guest_id, g.first_name, g.last_name, g.email, g.phone,
        rm.room_number, rm.hotel_id
      FROM Feedback f
      JOIN Reservations r ON f.reservation_id = r.reservation_id
      JOIN Guests g ON r.guest_id = g.guest_id
      JOIN Rooms rm ON r.room_id = rm.room_id
    `;
    
    // Add hotel filter if hotelId is provided
    if (hotelId) {
      query += ' WHERE rm.hotel_id = @hotelId';
      request.input('hotelId', sql.Int, hotelId);
    }
    
    query += ' ORDER BY f.submitted_time DESC';
    
    const result = await request.query(query);
    return result.recordset.map((row) => ({
      feedback_id: row.feedback_id,
      reservation_id: row.reservation_id,
      comments: row.comments,
      rating: row.rating,
      submitted_time: formatDate(new Date(row.submitted_time)),
      guest_name: `${row.first_name} ${row.last_name}`,
      room_number: row.room_number,
    }));
  } catch (err) {
    console.error("Error in getAllFeedback:", err);
    throw err;
  }
}


// ✅ Get feedback by ID
async function getFeedbackById(feedback_id) {
  const request = new sql.Request();
  const result = await request
    .input("feedback_id", sql.Int, feedback_id)
    .query("SELECT * FROM Feedback WHERE feedback_id=@feedback_id");

  const row = result.recordset[0];
  if (!row) return null;
  return { ...row, submitted_time: formatDate(new Date(row.submitted_time)) };
}

// ✅ Update feedback
async function updateFeedback(feedback_id, data) {
  const { comments, rating } = data;
  const now = new Date();

  const request = new sql.Request();
  await request
    .input("feedback_id", sql.Int, feedback_id)
    .input("comments", sql.NVarChar, comments || "")
    .input("rating", sql.Int, rating || 0)
    .input("submitted_time", sql.DateTime, now)
    .query(`
      UPDATE Feedback
      SET comments=@comments, rating=@rating, submitted_time=@submitted_time
      WHERE feedback_id=@feedback_id
    `);

  return getFeedbackById(feedback_id);
}

// ✅ Delete feedback
async function deleteFeedback(feedback_id) {
  const request = new sql.Request();
  await request
    .input("feedback_id", sql.Int, feedback_id)
    .query("DELETE FROM Feedback WHERE feedback_id=@feedback_id");
  return true;
}

module.exports = {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getFeedbackByReservationId, // 👈 added helper
};
