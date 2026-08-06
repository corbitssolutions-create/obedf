import express from 'express';
import {
  getDashboardStats,
  getRecentActivity,
  getLatestWaybills,
  getShipmentStatus,
  getRevenue,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Secure all endpoints with auth check
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/latest-waybills', getLatestWaybills);
router.get('/shipment-status', getShipmentStatus);
router.get('/revenue', getRevenue);

export default router;
