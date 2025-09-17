const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/", verifyToken, feedbackController.createFeedback);
router.get("/", verifyToken, feedbackController.getAllFeedback);
router.get("/:id", verifyToken, feedbackController.getFeedback);
router.put("/:id", verifyToken, feedbackController.updateFeedback);
router.delete("/:id", verifyToken, feedbackController.deleteFeedback);

module.exports = router;
