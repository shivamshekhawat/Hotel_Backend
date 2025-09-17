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

// Get all reservations

const getReservations = async (req, res, next) => {
  try {
    const reservations = await reservationModel.getAllReservations();
    res.json(reservations);
  } catch (err) {
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
