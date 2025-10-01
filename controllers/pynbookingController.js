const pynbookingService = require('../services/pynbookingService');
const { sql } = require('../db');

// Sync all reservations from PynBooking
exports.syncReservations = async (req, res) => {
  try {
    const result = await pynbookingService.syncReservations();
    res.json({ 
      success: true, 
      message: 'Sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get reservation by room number
// In pynbookingController.js
exports.getReservationByRoom = async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const request = new sql.Request();
    
    const result = await request
      .input('room_number', sql.NVarChar, roomNumber)
      .query(`
        SELECT 
          r.reservation_id,
          r.guest_id,
          r.room_id,
          r.check_in_time,
          r.check_out_time,
          r.is_checked_in,
          g.first_name, 
          g.last_name, 
          g.phone, 
          g.email,
          rm.room_number
        FROM Reservations r
        LEFT JOIN Guests g ON r.guest_id = g.guest_id
        LEFT JOIN Rooms rm ON r.room_id = rm.room_id
        WHERE rm.room_number = @room_number
        AND r.check_out_time >= GETDATE()
        ORDER BY r.check_in_time ASC
      `);
      
    const reservation = result.recordset[0] || null;
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'No active reservation found for this room'
      });
    }
    
    res.json({ 
      success: true, 
      data: reservation
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reservation. Please try again later.'
    });
  }
};

// Get all reservations
exports.getAllReservations = async (req, res) => {
  try {
    const request = new sql.Request();
    
    const result = await request.query(`
      SELECT r.*, 
             g.first_name, g.last_name, g.phone, g.email,
             rm.room_number
      FROM Reservations r
      LEFT JOIN Guests g ON r.guest_id = g.guest_id
      LEFT JOIN Rooms rm ON r.room_id = rm.room_id
      WHERE r.check_out_time >= GETDATE()
      ORDER BY r.check_in_time ASC
    `);
      
    res.json({ 
      success: true, 
      data: result.recordset 
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
