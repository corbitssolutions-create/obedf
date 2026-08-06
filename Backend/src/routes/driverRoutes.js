import express from 'express';
import {
  getDrivers,
  lookupDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/driverController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/lookup', lookupDrivers);

router.route('/')
  .get(getDrivers)
  .post(authorize('Super Admin', 'Administrator', 'Dispatcher'), createDriver);

router.route('/:id')
  .get(getDriverById)
  .put(authorize('Super Admin', 'Administrator', 'Dispatcher'), updateDriver)
  .delete(authorize('Super Admin', 'Administrator'), deleteDriver);

export default router;
