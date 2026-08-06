import express from 'express';
import {
  getSuppliers, lookupSuppliers, getSupplierById,
  createSupplier, updateSupplier, deleteSupplier,
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/lookup', lookupSuppliers);
router.route('/').get(getSuppliers).post(authorize('Super Admin','Administrator'), createSupplier);
router.route('/:id').get(getSupplierById).put(authorize('Super Admin','Administrator'), updateSupplier).delete(authorize('Super Admin','Administrator'), deleteSupplier);
export default router;
