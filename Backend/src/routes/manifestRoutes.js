import express from 'express';
import {
  getManifests,
  getManifestById,
  createManifest,
  updateManifest,
  deleteManifest,
  resolveScan,
} from '../controllers/manifestController.js';
import { protect } from '../middleware/auth.js';
import { validateManifest } from '../validations/validation.js';

const router = express.Router();

// Secure all endpoints with auth check
router.use(protect);

// Scan resolution endpoint
router.post('/resolve-scan', resolveScan);

router.route('/')
  .get(getManifests)
  .post(validateManifest, createManifest);

router.route('/:id')
  .get(getManifestById)
  .put(validateManifest, updateManifest)
  .delete(deleteManifest);

export default router;
