import express from 'express';
import {
  getContractors,
  lookupContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
} from '../controllers/contractorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Lookup must come before /:id to avoid being matched as an ID
router.get('/lookup', lookupContractors);

router.route('/')
  .get(getContractors)
  .post(authorize('Super Admin', 'Administrator'), createContractor);

router.route('/:id')
  .get(getContractorById)
  .put(authorize('Super Admin', 'Administrator'), updateContractor)
  .delete(authorize('Super Admin'), deleteContractor);

export default router;
