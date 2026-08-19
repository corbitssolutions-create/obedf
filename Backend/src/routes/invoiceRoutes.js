import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.post('/:id/payment', recordPayment);

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(authorize('Super Admin', 'Administrator', 'Finance Manager'), deleteInvoice);

export default router;
