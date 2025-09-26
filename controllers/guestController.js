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


// Get all guests

const getGuests = async (req, res, next) => {
  try {
    const guest = await guestModel.getAllGuests();
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
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
