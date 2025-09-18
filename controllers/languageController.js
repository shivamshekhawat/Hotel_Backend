const languageModel = require("../models/languageModel");


// Create language


const createLanguage = async (req, res, next) => {
  try {
    const language = await languageModel.createLanguage(req.body);
    return res.status(201).json({
      message: "Language created successfully",
      data: language,
    });
  } catch (err) {
    // If model attached a statusCode, use it (validation/duplicate errors)
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // otherwise pass to global handler
    next(err);
  }
};


// Get all languages

const getAllLanguages = async (req, res, next) => {
  try {
    const languages = await languageModel.getAllLanguages();
    res.json(languages);
  } catch (err) {
    next(err);
  }
};

// Get language by ID

const getLanguage = async (req, res, next) => {
  try {
    const language = await languageModel.getLanguageById(req.params.id);
    if (!language) return res.status(404).json({ message: "Language not found" });
    res.json(language);
  } catch (err) {
    next(err);
  }
};


// Update language

const updateLanguage = async (req, res, next) => {
  try {
    const updated = await languageModel.updateLanguage(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};


// Delete language

const deleteLanguage = async (req, res, next) => {
  try {
    await languageModel.deleteLanguage(req.params.id);
    res.json({ message: "Language deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Export

module.exports = {
  createLanguage,
  getAllLanguages,
  getLanguage,
  updateLanguage,
  deleteLanguage,
};
