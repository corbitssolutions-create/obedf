/**
 * Rating Routes
 *
 * Base: /api/ratings
 *
 * Delivery Areas:
 *   GET    /delivery-areas/lookup          — dropdown list (Active only)
 *   GET    /delivery-areas                 — full list with pagination
 *   POST   /delivery-areas                 — create
 *   GET    /delivery-areas/:id             — single record
 *   PUT    /delivery-areas/:id             — update
 *   DELETE /delivery-areas/:id             — delete (guarded)
 *
 * Freight Rates:
 *   GET    /rates                          — list with filters
 *   POST   /rates                          — create
 *   GET    /rates/:id                      — single record
 *   PUT    /rates/:id                      — update
 *   DELETE /rates/:id                      — delete
 *   PUT    /rates/:id/toggle-status        — activate / deactivate
 *
 * Engine:
 *   POST   /preview                        — calculate freight without saving
 *   GET    /resolve-area/:postalCode       — resolve postal code → delivery area
 *   GET    /matrix                         — grouped rate matrix view
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

import {
  // Delivery Areas
  getDeliveryAreas,
  lookupDeliveryAreas,
  getDeliveryAreaById,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,

  // Freight Rates
  getFreightRates,
  getFreightRateById,
  createFreightRate,
  updateFreightRate,
  deleteFreightRate,
  toggleFreightRateStatus,

  // Engine
  previewRating,
  resolveAreaByPostalCode,
  getRateMatrix,
} from '../controllers/ratingController.js';

const router = express.Router();
const WRITE  = ['Super Admin', 'Administrator'];

// All rating routes require authentication
router.use(protect);

// ── Delivery Areas ────────────────────────────────────────────────────────────
router.get('/delivery-areas/lookup', lookupDeliveryAreas);          // before /:id
router.route('/delivery-areas')
  .get(getDeliveryAreas)
  .post(authorize(...WRITE), createDeliveryArea);

router.route('/delivery-areas/:id')
  .get(getDeliveryAreaById)
  .put(authorize(...WRITE), updateDeliveryArea)
  .delete(authorize(...WRITE), deleteDeliveryArea);

// ── Freight Rates ─────────────────────────────────────────────────────────────
router.route('/rates')
  .get(getFreightRates)
  .post(authorize(...WRITE), createFreightRate);

router.route('/rates/:id')
  .get(getFreightRateById)
  .put(authorize(...WRITE), updateFreightRate)
  .delete(authorize(...WRITE), deleteFreightRate);

router.put('/rates/:id/toggle-status', authorize(...WRITE), toggleFreightRateStatus);

// ── Engine ────────────────────────────────────────────────────────────────────
router.post('/preview',                      previewRating);
router.get('/resolve-area/:postalCode',      resolveAreaByPostalCode);
router.get('/matrix',                        getRateMatrix);

export default router;
