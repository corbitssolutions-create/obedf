import express from 'express';
import {
  getExchangeRates, getExchangeRateById,
  createExchangeRate, updateExchangeRate, deleteExchangeRate,
} from '../controllers/exchangeRateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getExchangeRates).post(authorize('Super Admin','Administrator'), createExchangeRate);
router.route('/:id').get(getExchangeRateById).put(authorize('Super Admin','Administrator'), updateExchangeRate).delete(authorize('Super Admin','Administrator'), deleteExchangeRate);
export default router;
