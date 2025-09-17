const technicalIssueModel = require("../models/technicalIssueModel");


// Create Technical Issue

const createTechnicalIssue = async (req, res, next) => {
  try {
    const issue = await technicalIssueModel.createTechnicalIssue(req.body);
    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
};


// Get all Technical Issues

const getTechnicalIssues = async (req, res, next) => {
  try {
    const issues = await technicalIssueModel.getAllTechnicalIssues();
    res.json(issues);
  } catch (err) {
    next(err);
  }
};


// Get Technical Issue by ID

const getTechnicalIssue = async (req, res, next) => {
  try {
    const issue = await technicalIssueModel.getTechnicalIssueById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (err) {
    next(err);
  }
};


// Update Technical Issue

const updateTechnicalIssue = async (req, res, next) => {
  try {
    const updatedIssue = await technicalIssueModel.updateTechnicalIssue(req.params.id, req.body);
    if (!updatedIssue) return res.status(404).json({ message: "Issue not found" });
    res.json({ message: "Technical issue updated successfully", updatedIssue });
  } catch (err) {
    next(err);
  }
};


// Delete Technical Issue

const deleteTechnicalIssue = async (req, res, next) => {
  try {
    await technicalIssueModel.deleteTechnicalIssue(req.params.id);
    res.json({ message: "Technical issue deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTechnicalIssue,
  getTechnicalIssues,
  getTechnicalIssue,
  updateTechnicalIssue,
  deleteTechnicalIssue,
};
