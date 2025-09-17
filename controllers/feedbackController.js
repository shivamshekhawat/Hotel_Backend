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
        message: "Feedback already submitted for this reservation.",
      });
    }

    // create feedback with current time
    const feedback = await feedbackModel.createFeedback({
      reservation_id,
      comments,
      rating,
      submitted_time: new Date(), // force current time
    });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all feedbacks
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await feedbackModel.getAllFeedback();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get feedback by ID
const getFeedback = async (req, res) => {
  try {
    const feedback = await feedbackModel.getFeedbackById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update feedback
const updateFeedback = async (req, res) => {
  try {
    const updated = await feedbackModel.updateFeedback(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  try {
    await feedbackModel.deleteFeedback(req.params.id);
    res.json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
