import express from 'express';
import {
  getWaybills,
  getWaybillById,
  createWaybill,
  updateWaybill,
  deleteWaybill,
} from '../controllers/waybillController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateWaybill } from '../validations/validation.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getWaybills)
  .post(validateWaybill, createWaybill);

router.route('/:id')
  .get(getWaybillById)
  .put(validateWaybill, updateWaybill)                       // any authenticated user
  .delete(authorize('Super Admin'), deleteWaybill);          // Super Admin only

export default router;
