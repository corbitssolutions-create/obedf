import express from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditEventTypes,
} from '../controllers/auditLogController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('Super Admin', 'Administrator'));

// Named before /:id
router.get('/events', getAuditEventTypes);

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

export default router;
