const technicalIssueModel = require("../models/technicalIssueModel");


// Create Technical Issue

const createTechnicalIssue = async (req, res, next) => {
  try {
    const issue = await technicalIssueModel.createTechnicalIssue(req.body);
    res.status(201).json({
      message: "Technical issue created successfully",
      status: 1,
      response: issue
    });
  } catch (err) {
    next(err);
  }
};


// Get all Technical Issues

const getTechnicalIssues = async (req, res, next) => {
  try {
    const issues = await technicalIssueModel.getAllTechnicalIssues();
    res.json({
      message: "Technical issues retrieved successfully",
      status: 1,
      response: issues
    });
  } catch (err) {
    next(err);
  }
};


// Get Technical Issue by ID

const getTechnicalIssue = async (req, res, next) => {
  try {
    const issue = await technicalIssueModel.getTechnicalIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        message: "Technical issue not found",
        status: 0,
        response: null
      });
    }
    res.json({
      message: "Technical issue retrieved successfully",
      status: 1,
      response: issue
    });
  } catch (err) {
    next(err);
  }
};


// Update Technical Issue

const updateTechnicalIssue = async (req, res, next) => {
  try {
    const updatedIssue = await technicalIssueModel.updateTechnicalIssue(req.params.id, req.body);
    if (!updatedIssue) {
      return res.status(404).json({
        message: "Technical issue not found",
        status: 0,
        response: null
      });
    }
    res.json({
      message: "Technical issue updated successfully",
      status: 1,
      response: updatedIssue
    });
  } catch (err) {
    next(err);
  }
};


// Delete Technical Issue

const deleteTechnicalIssue = async (req, res, next) => {
  try {
    await technicalIssueModel.deleteTechnicalIssue(req.params.id);
    res.json({
      message: "Technical issue deleted successfully",
      status: 1,
      response: null
    });
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
