import express from 'express';
import {
  getBillingAccounts, lookupBillingAccounts, getBillingAccountById,
  getBillingAccountDefaults,
  createBillingAccount, updateBillingAccount, deleteBillingAccount,
} from '../controllers/billingAccountController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Lookup (used in dropdowns)
router.get('/lookup', lookupBillingAccounts);

// Defaults endpoint — returns only the fields needed to pre-fill a Waybill form
router.get('/:id/defaults', getBillingAccountDefaults);

// Standard CRUD
router.route('/')
  .get(getBillingAccounts)
  .post(authorize('Super Admin', 'Administrator', 'Dispatcher', 'Finance User', 'Sales User'), createBillingAccount);

router.route('/:id')
  .get(getBillingAccountById)
  .put(authorize('Super Admin', 'Administrator'), updateBillingAccount)
  .delete(authorize('Super Admin', 'Administrator'), deleteBillingAccount);

export default router;
