import express from 'express';
import {
  getPODs,
  getPODById,
  getPODByWaybillNo,
  createPOD,
  updatePOD,
  deletePOD,
} from '../controllers/podController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Specific named routes before /:id
router.get('/waybill/:waybillNo', getPODByWaybillNo);

router.route('/')
  .get(getPODs)
  .post(createPOD);

router.route('/:id')
  .get(getPODById)
  .put(updatePOD)
  .delete(authorize('Super Admin', 'Administrator'), deletePOD);

export default router;
