const guestModel = require("../models/guestModel");


// Create guest

const createGuest = async (req, res, next) => {
  try {
    const guest = await guestModel.createGuest(req.body);
    res.status(201).json(guest); // return guest (new or existing)
  } catch (err) {
    next(err); // pass to global error handler
  }
};


// Get all guests

const getGuests = async (req, res, next) => {
  try {
    const guests = await guestModel.getAllGuests();
    res.json(guests);
  } catch (err) {
    next(err);
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
  getGuest,
  updateGuest,
  deleteGuest,
};
