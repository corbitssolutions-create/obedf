import express from 'express';
import {
  getTrailers, lookupTrailers, getTrailerById,
  createTrailer, updateTrailer, deleteTrailer,
} from '../controllers/trailerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/lookup', lookupTrailers);
router.route('/').get(getTrailers).post(authorize('Super Admin','Administrator'), createTrailer);
router.route('/:id').get(getTrailerById).put(authorize('Super Admin','Administrator'), updateTrailer).delete(authorize('Super Admin','Administrator'), deleteTrailer);
export default router;
