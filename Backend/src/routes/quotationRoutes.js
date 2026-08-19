import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} from '../controllers/quotationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getQuotations)
  .post(createQuotation);

router.route('/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(authorize('Super Admin', 'Administrator', 'Sales Manager', 'Operation Manager'), deleteQuotation);

export default router;
