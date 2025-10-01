const reservationModel = require("../models/reservationModel");


// Create reservation

const createReservation = async (req, res, next) => {
  try {
    const reservation = await reservationModel.createReservation(req.body);
    res.status(201).json(reservation);
  } catch (err) {
    // Handle known validation errors
    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message }); // Conflict
    }
    if (err.message.includes("check_out_time must be later")) {
      return res.status(400).json({ error: err.message }); // Bad Request
    }
    next(err); // Pass unknown errors to global error handler
  }
};

// Get all reservations with optional hotel filtering
const getReservations = async (req, res, next) => {
  try {
    // Get hotel_id from query parameter or URL parameter
    const hotelId = req.query.hotel_id || req.params.hotelId;
    
    // Convert to number if it exists
    const parsedHotelId = hotelId ? parseInt(hotelId, 10) : null;
    
    // Validate hotel_id if provided
    if (parsedHotelId && isNaN(parsedHotelId)) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid hotel_id parameter. Must be a number.',
        response: []
      });
    }

    // Get reservations with optional hotel filtering
    const reservations = await reservationModel.getAllReservations(parsedHotelId);
    
    res.status(200).json({
      status: 1,
      message: reservations.length > 0 ? "Reservations retrieved successfully" : "No reservations found",
      response: reservations
    });
  } catch (err) {
    console.error('Error in getReservations:', err);
    next(err);
  }
};


// Get reservation by ID

const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationModel.getReservationById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });
    res.json(reservation);
  } catch (err) {
    next(err);
  }
};

// Update reservation

const updateReservation = async (req, res, next) => {
  try {
    const updatedReservation = await reservationModel.updateReservation(req.params.id, req.body);
    res.json(updatedReservation);
  } catch (err) {
    if (err.message.includes("check_out_time must be later")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};


// Delete reservation

const deleteReservation = async (req, res, next) => {
  try {
    await reservationModel.deleteReservation(req.params.id);
    res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Export

module.exports = {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  deleteReservation,
};
