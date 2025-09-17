
const express = require("express");
const router = express.Router();
const languageController = require("../controllers/languageController");

router.post("/", languageController.createLanguage);       // Create
router.get("/", languageController.getAllLanguages);       // Get all
router.get("/:id", languageController.getLanguage);        // Get by ID
router.put("/:id", languageController.updateLanguage);     // Update
router.delete("/:id", languageController.deleteLanguage);  // Delete

module.exports = router;
