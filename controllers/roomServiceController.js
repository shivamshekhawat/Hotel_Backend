const roomServiceModel = require("../models/roomServiceModel");


// Create room service

const createRoomService = async (req, res, next) => {
  try {
    const service = await roomServiceModel.createRoomService(req.body);
    res.status(201).json({
      message: "Room service created successfully",
      status: 1,
      response: service
    });
  } catch (err) {
    // Handle duplicate requests
    if (err.message.includes("already exists")) {
      return res.status(409).json({
        message: err.message,
        status: 0,
        response: null
      });
    }
    next(err); // Pass unknown errors to global error handler
  }
};

// Get all room services

const getRoomServices = async (req, res, next) => {
  try {
    const services = await roomServiceModel.getAllRoomServices(req.body.reservation_id);
    res.json({
      message: "Room services retrieved successfully",
      status: 1,
      response: services
    });
  } catch (err) {
    next(err);
  }
};


// Get room service by ID

const getRoomService = async (req, res, next) => {
  try {
    const service = await roomServiceModel.getRoomServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({
        message: "Room service not found",
        status: 0,
        response: null
      });
    }
    res.json({
      message: "Room service retrieved successfully",
      status: 1,
      response: service
    });
  } catch (err) {
    next(err);
  }
};


// Update room service

const updateRoomService = async (req, res, next) => {
  try {
    const updatedService = await roomServiceModel.updateRoomService(req.params.id, req.body);
    res.json({
      message: "Room service updated successfully",
      status: 1,
      response: updatedService
    });
  } catch (err) {
    next(err);
  }
};


// Delete room service

const deleteRoomService = async (req, res, next) => {
  try {
    await roomServiceModel.deleteRoomService(req.params.id);
    res.json({
      message: "Room service deleted successfully",
      status: 1,
      response: null
    });
  } catch (err) {
    next(err);
  }
};

// Export
module.exports = {
  createRoomService,
  getRoomServices,
  getRoomService,
  updateRoomService,
  deleteRoomService,
};
