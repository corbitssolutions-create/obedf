import express from 'express';
import {
  getPublicBranches,
  getBranches,
  lookupBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ── PUBLIC — no token required (needed for login page branch dropdown) ────────
router.get('/public', getPublicBranches);

// ── Protected — all other routes require a valid JWT ──────────────────────────
router.use(protect);

router.get('/lookup', lookupBranches);

router.route('/')
  .get(getBranches)
  .post(authorize('Super Admin', 'Administrator'), createBranch);

router.route('/:id')
  .get(getBranchById)
  .put(authorize('Super Admin', 'Administrator'), updateBranch)
  .delete(authorize('Super Admin'), deleteBranch);

export default router;
