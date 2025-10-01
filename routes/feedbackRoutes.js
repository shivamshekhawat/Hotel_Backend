const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create new feedback
router.post("/", verifyToken, feedbackController.createFeedback);

// Get feedback with optional hotel filtering
// GET /api/feedback - gets all feedback
// GET /api/feedback?hotel_id=93 - gets feedback for hotel with ID 93
// GET /api/feedback/hotel/93 - alternative way to get feedback by hotel ID
router.get(["/", "/hotel/:hotelId"], verifyToken, feedbackController.getAllFeedback);

// Get, update, or delete a specific feedback
router.get("/:id", verifyToken, feedbackController.getFeedback);
router.put("/:id", verifyToken, feedbackController.updateFeedback);
router.delete("/:id", verifyToken, feedbackController.deleteFeedback);

module.exports = router;
