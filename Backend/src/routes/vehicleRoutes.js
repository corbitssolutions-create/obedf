import express from 'express';
import {
  getVehicles,
  lookupVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/lookup', lookupVehicles);

router.route('/')
  .get(getVehicles)
  .post(authorize('Super Admin', 'Administrator'), createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .put(authorize('Super Admin', 'Administrator'), updateVehicle)
  .delete(authorize('Super Admin', 'Administrator'), deleteVehicle);

export default router;
