
const express = require("express");
const router = express.Router();
const technicalIssueController = require("../controllers/technicalIssueController");

router.post("/", technicalIssueController.createTechnicalIssue);       // Create
router.get("/", technicalIssueController.getTechnicalIssues);          // Get all
router.get("/:id", technicalIssueController.getTechnicalIssue);        // Get by ID
router.put("/:id", technicalIssueController.updateTechnicalIssue);     // Update
router.delete("/:id", technicalIssueController.deleteTechnicalIssue);  // Delete

module.exports = router;
