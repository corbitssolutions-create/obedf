import express from 'express';
import {
  getRoutes,
  lookupRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} from '../controllers/routeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/lookup', lookupRoutes);

router.route('/')
  .get(getRoutes)
  .post(authorize('Super Admin', 'Administrator', 'Dispatcher'), createRoute);

router.route('/:id')
  .get(getRouteById)
  .put(authorize('Super Admin', 'Administrator', 'Dispatcher'), updateRoute)
  .delete(authorize('Super Admin', 'Administrator'), deleteRoute);

export default router;
