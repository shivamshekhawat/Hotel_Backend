// controllers/feedbackController.js
const feedbackModel = require("../models/feedbackModel");

// Create feedback

const createFeedback = async (req, res) => {
  try {
    const { reservation_id, comments, rating } = req.body;

    // check if feedback already exists for this reservation
    const existingFeedback = await feedbackModel.getFeedbackByReservationId(reservation_id);

    if (existingFeedback) {
      return res.status(400).json({
        message: "Feedback already submitted for this reservation",
        status: 0,
        response: null
      });
    }

    // create feedback with current time
    const feedback = await feedbackModel.createFeedback({
      reservation_id,
      comments,
      rating,
      submitted_time: new Date(), // force current time
    });

    res.status(201).json({
      message: "Feedback created successfully",
      status: 1,
      response: feedback
    });
  } catch (err) {
    console.error('Error in createFeedback:', err);
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};

// Get all feedbacks with optional hotel filtering
const getAllFeedback = async (req, res) => {
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

    // Get feedback with optional hotel filtering
    const feedbacks = await feedbackModel.getAllFeedback(parsedHotelId);
    
    res.status(200).json({
      status: 1,
      message: feedbacks.length > 0 ? "Feedback retrieved successfully" : "No feedback found",
      response: feedbacks
    });
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    res.status(500).json({
      message: "Error retrieving feedback",
      status: 0,
      response: null,
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const feedback = await feedbackModel.getFeedbackById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
        status: 0,
        response: null
      });
    }
    res.json({
      message: "Feedback retrieved successfully",
      status: 1,
      response: feedback
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};

// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const updated = await feedbackModel.updateFeedback(req.params.id, req.body);
    res.json({
      message: "Feedback updated successfully",
      status: 1,
      response: updated
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    await feedbackModel.deleteFeedback(req.params.id);
    res.json({
      message: "Feedback deleted successfully",
      status: 1,
      response: null
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      status: 0,
      response: null
    });
  }
};

// 👇 Ye line sabko ek object me export karegi
module.exports = {
  createFeedback,
  getAllFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
};
