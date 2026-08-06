import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  createNotification,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Named action routes before /:id
router.put('/read-all', markAllAsRead);
router.delete('/clear-read', clearReadNotifications);

router.route('/')
  .get(getNotifications)
  .post(authorize('Super Admin', 'Administrator'), createNotification);

router.route('/:id')
  .delete(deleteNotification);

router.put('/:id/read', markAsRead);

export default router;
