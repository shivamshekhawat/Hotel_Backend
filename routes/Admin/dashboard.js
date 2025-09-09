const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const { pool, poolConnect } = require('../../db');
const dayjs = require('dayjs');

router.get('/', adminAuth, async (req, res) => {
  try {
    await poolConnect;

    // Guests
    const guestsResult = await pool.request()
      .query('SELECT TOP 5 * FROM Guests ORDER BY checkIn DESC');

    // Rooms
    const roomsResult = await pool.request()
      .query(`SELECT TOP 5 
                room_id, 
                logo_url, 
                client_name, 
                number_of_adults, 
                number_of_children, 
                language,
                current_ac_temp,
                is_checked_in,
                check_in_time,
                check_out_time,
                is_dnd_on,
                master_light,
                master_curtain,
                master_window,
                reading_light,
                service_care_number,
                unread_notification,
                greeting_message
              FROM Rooms`);

    // Notifications
    const notificationsResult = await pool.request()
      .query('SELECT TOP 5 * FROM Notifications ORDER BY time DESC');

    // Stats
    const totalRoomsResult = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Rooms');
    const cleanRequestsResult = await pool.request()
      .query('SELECT COUNT(*) AS total FROM Rooms WHERE is_checked_in = 0');

    const totalRooms = totalRoomsResult.recordset[0]?.total ?? 0;
    const cleanRequests = cleanRequestsResult.recordset[0]?.total ?? 0;

    // Format guests times
    const guests = (guestsResult.recordset ?? []).map(g => {
      const parsed = dayjs(g.checkIn);
      return {
        ...g,
        checkIn: parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm:ss') : "Time is missing"
      };
    });

    // Format notifications times
    const notifications = (notificationsResult.recordset ?? []).map(n => {
      const parsed = dayjs(n.time);
      return {
        ...n,
        time: parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm:ss') : null
      };
    });

    // Format rooms
    const rooms = roomsResult.recordset.map(room => {
      let formattedCheckIn;
      let formattedCheckOut = null;

      if (room.is_checked_in) {
        if (!room.check_in_time) {
          // Time missing for checked-in room
          formattedCheckIn = "Time is missing";
        } else {
          const parsed = dayjs(room.check_in_time);
          formattedCheckIn = parsed.isValid()
            ? parsed.format('DD/MM/YYYY HH:mm:ss')
            : "Time is missing";
        }
      } else {
        // Not checked in
        formattedCheckIn = false;
      }

      if (room.check_out_time) {
        const parsedOut = dayjs(room.check_out_time);
        formattedCheckOut = parsedOut.isValid() ? parsedOut.format('DD/MM/YYYY HH:mm:ss') : null;
      }

      return {
        ...room,
        check_in_time: formattedCheckIn,
        check_out_time: formattedCheckOut
      };
    });

    res.json({
      success: true,
      data: {
        guests,
        rooms,
        notifications,
        stats: { totalRooms, cleanRequests }
      }
    });

  } catch (err) {
    console.error('Admin dashboard error:', err.message, err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

module.exports = router;
