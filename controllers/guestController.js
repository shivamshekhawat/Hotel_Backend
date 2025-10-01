const guestModel = require("../models/guestModel");


// Create guest


const createGuest = async (req, res, next) => {
  try {
    // ✅ Basic request body validation
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is required" });
    }

    const guest = await guestModel.createGuest(req.body);

    // ✅ Created successfully
    res.status(201).json({
      message: "Guest created successfully",
      data: guest,
    });
  } catch (err) {
    // ❌ Handle duplicate guest error gracefully
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message }); // 409 Conflict
    }

    // Pass unknown errors to global handler
    next(err);
  }
};


// Get all guests with optional hotel filtering
// GET /api/guests - gets all guests
// GET /api/guests?hotel_id=93 - gets guests for hotel with ID 93
const getGuests = async (req, res, next) => {
  try {
    const hotelId = req.query.hotel_id ? parseInt(req.query.hotel_id) : null;
    
    if (hotelId && isNaN(hotelId)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid hotel_id. Must be a number",
        response: null
      });
    }
    
    const guests = await guestModel.getAllGuests(hotelId);
    
    res.status(200).json({
      status: 1,
      message: guests.length > 0 ? "Guests retrieved successfully" : "No guests found",
      response: guests
    });
  } catch (err) {
    console.error('[GuestController] Error in getGuests:', err);
    next(err);
  }
};

// Get all guests with room information and optional hotel filtering
// GET /api/guests/with-rooms - gets all guests with room info
// GET /api/guests/with-rooms?hotel_id=93 - gets guests with room info for specific hotel
const getGuestsWithRooms = async (req, res, next) => {
  try {
    console.log('[GuestController] Fetching guests with room information...');
    
    const hotelId = req.query.hotel_id ? parseInt(req.query.hotel_id) : null;
    
    if (hotelId && isNaN(hotelId)) {
      return res.status(400).json({
        status: 0,
        message: "Invalid hotel_id. Must be a number",
        response: null
      });
    }
    
    const guests = await guestModel.getGuestsWithRooms(hotelId);
    
    if (!guests || !Array.isArray(guests)) {
      throw new Error('Invalid response from database');
    }

    console.log(`[GuestController] Found ${guests.length} guests with room information`);
    
    // Format the response to group guests with their room information
    const formattedGuests = guests.map(guest => {
      // Ensure all required fields are present
      if (!guest || !guest.guest_id) {
        console.warn('[GuestController] Skipping invalid guest record:', guest);
        return null;
      }
      
      return {
        guest_id: guest.guest_id,
        first_name: guest.first_name || '',
        last_name: guest.last_name || '',
        email: guest.email || null,
        phone: guest.phone || null,
        language: guest.language || 'en',
        hotel_id: guest.hotel_id || null,
        room: guest.room_number ? {
          room_id: guest.room_id,
          room_number: guest.room_number,
          check_in_time: guest.check_in_time || null,
          check_out_time: guest.check_out_time || null,
          is_checked_in: Boolean(guest.is_checked_in)
        } : null
      };
    }).filter(guest => guest !== null); // Remove any null entries
    
    res.status(200).json({
      status: 1,
      message: formattedGuests.length > 0 
        ? `Successfully retrieved ${formattedGuests.length} guests` 
        : 'No guest records found',
      count: formattedGuests.length,
      response: formattedGuests
    });
    
  } catch (err) {
    console.error('[GuestController] Error in getGuestsWithRooms:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error types
    if (err.message.includes('Invalid number') || 
        err.message.includes('Validation failed for parameter')) {
      return res.status(400).json({
        status: 0,
        message: 'Data validation error. Please check the guest records for invalid data.',
        error: 'Invalid data format in database'
      });
    }
    
    // Default error response
    res.status(500).json({
      status: 0,
      message: 'Failed to retrieve guest information',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};


// Get guest by ID

const getGuest = async (req, res, next) => {
  try {
    const guest = await guestModel.getGuestById(req.params.id);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
  } catch (err) {
    next(err);
  }
};

// Update guest

const updateGuest = async (req, res, next) => {
  try {
    const updatedGuest = await guestModel.updateGuest(req.params.id, req.body);
    res.json(updatedGuest);
  } catch (err) {
    next(err);
  }
};

// Delete guest

const deleteGuest = async (req, res, next) => {
  try {
    await guestModel.deleteGuest(req.params.id);
    res.json({ message: "Guest deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Export

module.exports = {
  createGuest,
  getGuests,
  getGuestsWithRooms,
  getGuest,
  updateGuest,
  deleteGuest,
};
