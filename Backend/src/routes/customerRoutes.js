import express from 'express';
import {
  getCustomers,
  lookupCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCustomer } from '../validations/validation.js';

const router = express.Router();

router.use(protect);

// Lookup before /:id
router.get('/lookup', lookupCustomers);

router.route('/')
  .get(getCustomers)
  .post(validateCustomer, createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(validateCustomer, updateCustomer)
  .delete(authorize('Super Admin', 'Administrator'), deleteCustomer);

export default router;
