import Notification from '../models/Notification.js';
import { buildQuery } from '../utils/queryHelper.js';

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Protected
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Protected
 */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark ALL notifications as read for the logged-in user
 * @route   PUT /api/notifications/read-all
 * @access  Protected
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Protected
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await notification.deleteOne();
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all read notifications for the logged-in user
 * @route   DELETE /api/notifications/clear-read
 * @access  Protected
 */
export const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id, isRead: true });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notification(s) cleared`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a notification (internal/admin use)
 * @route   POST /api/notifications
 * @access  Protected (Admin+)
 */
export const createNotification = async (req, res, next) => {
  try {
    const { recipient, title, message, type } = req.body;

    if (!recipient || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'recipient, title, and message are required',
      });
    }

    const notification = await Notification.create({ recipient, title, message, type });
    res.status(201).json({ success: true, message: 'Notification created', data: notification });
  } catch (error) {
    next(error);
  }
};
