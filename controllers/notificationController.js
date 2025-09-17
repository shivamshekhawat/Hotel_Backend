const notificationModel = require("../models/notificationModel");


// Create notification

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationModel.createNotification(req.body);
    res.status(201).json(notification);
  } catch (err) {
    next(err); // pass to global error handler
  }
};


// Get all notifications

const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationModel.getAllNotifications();
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};


// Get notification by ID

const getNotification = async (req, res, next) => {
  try {
    const notification = await notificationModel.getNotificationById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};


// Update notification

const updateNotification = async (req, res, next) => {
  try {
    const updated = await notificationModel.updateNotification(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};


// Delete notification

const deleteNotification = async (req, res, next) => {
  try {
    await notificationModel.deleteNotification(req.params.id);
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Export

module.exports = {
  createNotification,
  getAllNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
};
