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

// Send notification to single or multiple targets
const sendNotification = async (req, res, next) => {
  try {
    const { message, target, targetId, priority = 'medium' } = req.body;

    // Validate required fields
    if (!message || !target) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message and target are required' 
      });
    }

    // Validate target
    const validTargets = ['all', 'room', 'guest', 'floor', 'multipleRooms'];
    if (!validTargets.includes(target)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid target. Must be one of: ${validTargets.join(', ')}` 
      });
    }

    // If target is not 'all', targetId is required unless it's a broadcast
    if (target !== 'all' && !targetId) {
      return res.status(400).json({ 
        success: false, 
        message: `targetId is required for target type: ${target}` 
      });
    }

    // If target is multipleRooms, ensure targetId is an array
    if (target === 'multipleRooms' && !Array.isArray(targetId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'targetId must be an array when target is multipleRooms' 
      });
    }

    // Send the notification
    const result = await notificationModel.sendNotification({
      message,
      target,
      targetId,
      priority
    });

    // Determine the appropriate status code based on success/failure
    const statusCode = result.success ? 201 : 207; // 207 for partial success

    res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: {
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        failedTargets: result.failedTargets,
        notifications: result.notifications
      }
    });

  } catch (error) {
    console.error('Error in sendNotification controller:', error);
    next(error);
  }
};

// Export

module.exports = {
  createNotification,
  getAllNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
};
