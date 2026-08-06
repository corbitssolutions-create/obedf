/**
 * Single file wires ALL lookup / master-data routes.
 * Each uses makeCrudController + makeCrudRouter from crudFactory.
 * ExtraCharge and Incoterm have custom controllers for extended functionality.
 */
import express from 'express';
import { makeCrudController, makeCrudRouter } from '../utils/crudFactory.js';
import { protect, authorize } from '../middleware/auth.js';

// ── Custom controllers ────────────────────────────────────────────────────────
import {
  getAllExtraCharges, lookupExtraCharges, getDefaultExtraCharges,
  getExtraChargeById, createExtraCharge, updateExtraCharge,
  deleteExtraCharge, toggleExtraChargeStatus, toggleExtraChargeDefault,
} from '../controllers/extraChargeController.js';

import {
  getAllIncoterms, lookupIncoterms, getIncotermById,
  createIncoterm, updateIncoterm, deleteIncoterm, toggleIncotermStatus,
} from '../controllers/incotermController.js';

import { lookupBranchByPostalCode } from '../controllers/postalCodeController.js';
import {
  getAllPostalCodes, getPostalCodeById, createPostalCode,
  updatePostalCode, deletePostalCode, togglePostalCodeStatus,
} from '../controllers/postalCodeController.js';

// ── Models ────────────────────────────────────────────────────────────────────
import Zone               from '../models/Zone.js';
import ServiceType        from '../models/ServiceType.js';
import RateType           from '../models/RateType.js';
import VehicleType        from '../models/VehicleType.js';
import FuelType           from '../models/FuelType.js';
import PackagingType      from '../models/PackagingType.js';
import ProductType        from '../models/ProductType.js';
import StatusCode         from '../models/StatusCode.js';
import FailureReason      from '../models/FailureReason.js';
import Currency           from '../models/Currency.js';
import Country            from '../models/Country.js';
import Province           from '../models/Province.js';
import City               from '../models/City.js';
import Suburb             from '../models/Suburb.js';
import PostalCode         from '../models/PostalCode.js';
import PaymentTerm        from '../models/PaymentTerm.js';
import PaymentMethod      from '../models/PaymentMethod.js';
import GlAccount          from '../models/GlAccount.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import DocumentTemplate   from '../models/DocumentTemplate.js';
import VatConfig          from '../models/VatConfig.js';
import RateCard           from '../models/RateCard.js';
import CustomerType       from '../models/CustomerType.js';

// ── Controllers (generic crudFactory) ────────────────────────────────────────
export const zoneCtrl              = makeCrudController(Zone,               ['code', 'name', 'description']);
// incotermCtrl removed — Incoterm uses custom controller (isActive, not status)
export const serviceTypeCtrl       = makeCrudController(ServiceType,        ['code', 'name', 'description']);
export const rateTypeCtrl          = makeCrudController(RateType,           ['code', 'name', 'unit']);
export const vehicleTypeCtrl       = makeCrudController(VehicleType,        ['code', 'name', 'description']);
export const fuelTypeCtrl          = makeCrudController(FuelType,           ['code', 'name']);
export const packagingTypeCtrl     = makeCrudController(PackagingType,      ['code', 'name']);
export const productTypeCtrl       = makeCrudController(ProductType,        ['code', 'name', 'description']);
export const statusCodeCtrl        = makeCrudController(StatusCode,         ['code', 'name', 'module']);
export const failureReasonCtrl     = makeCrudController(FailureReason,      ['code', 'name', 'description']);
export const currencyCtrl          = makeCrudController(Currency,           ['code', 'name', 'symbol']);
export const countryCtrl           = makeCrudController(Country,            ['code', 'name', 'dialingCode']);
export const provinceCtrl          = makeCrudController(Province,           ['code', 'name']);
export const cityCtrl              = makeCrudController(City,               ['name']);
export const suburbCtrl            = makeCrudController(Suburb,             ['name', 'postalCode']);
export const postalCodeCtrl        = makeCrudController(PostalCode,         ['code', 'suburb', 'city']);
export const paymentTermCtrl       = makeCrudController(PaymentTerm,        ['code', 'name']);
export const paymentMethodCtrl     = makeCrudController(PaymentMethod,      ['code', 'name']);
export const glAccountCtrl         = makeCrudController(GlAccount,          ['accountCode', 'accountName', 'accountType']);
export const notifTemplateCtrl     = makeCrudController(NotificationTemplate, ['code', 'name', 'type', 'module']);
export const docTemplateCtrl       = makeCrudController(DocumentTemplate,   ['code', 'name', 'documentType']);
export const vatConfigCtrl         = makeCrudController(VatConfig,          ['code', 'name']);
export const rateCardCtrl          = makeCrudController(RateCard,           ['code', 'name', 'origin', 'destination']);
export const customerTypeCtrl      = makeCrudController(CustomerType,        ['code', 'name', 'description']);

// ── Routers ───────────────────────────────────────────────────────────────────
const router = express.Router();
const WRITE  = ['Super Admin', 'Administrator'];

// ── Extra Charges — custom router (has /defaults + /toggle-default) ──────────
const ecRouter = express.Router();
ecRouter.use(protect);
ecRouter.get('/lookup',              lookupExtraCharges);
ecRouter.get('/defaults',            getDefaultExtraCharges);
ecRouter.get('/',                    getAllExtraCharges);
ecRouter.post('/',                   authorize(...WRITE), createExtraCharge);
ecRouter.get('/:id',                 getExtraChargeById);
ecRouter.put('/:id',                 authorize(...WRITE), updateExtraCharge);
ecRouter.delete('/:id',              authorize(...WRITE), deleteExtraCharge);
ecRouter.put('/:id/toggle-status',   authorize(...WRITE), toggleExtraChargeStatus);
ecRouter.put('/:id/toggle-default',  authorize(...WRITE), toggleExtraChargeDefault);

router.use('/extra-charges', ecRouter);

// ── Incoterms — custom router (uses isActive, not status string) ─────────────
const itRouter = express.Router();
itRouter.use(protect);
itRouter.get('/lookup',            lookupIncoterms);          // isActive=true only → dropdown
itRouter.get('/',                  getAllIncoterms);           // all records → admin table
itRouter.post('/',                 authorize(...WRITE), createIncoterm);
itRouter.get('/:id',               getIncotermById);
itRouter.put('/:id',               authorize(...WRITE), updateIncoterm);
itRouter.delete('/:id',            authorize(...WRITE), deleteIncoterm);
itRouter.put('/:id/toggle-status', authorize(...WRITE), toggleIncotermStatus);

router.use('/incoterms', itRouter);

router.use('/zones',                makeCrudRouter(zoneCtrl));
router.use('/service-types',        makeCrudRouter(serviceTypeCtrl));
router.use('/rate-types',           makeCrudRouter(rateTypeCtrl));
router.use('/vehicle-types',        makeCrudRouter(vehicleTypeCtrl));
router.use('/fuel-types',           makeCrudRouter(fuelTypeCtrl));
router.use('/packaging-types',      makeCrudRouter(packagingTypeCtrl));
router.use('/product-types',        makeCrudRouter(productTypeCtrl));
router.use('/status-codes',         makeCrudRouter(statusCodeCtrl));
router.use('/failure-reasons',      makeCrudRouter(failureReasonCtrl));
router.use('/currencies',           makeCrudRouter(currencyCtrl));
router.use('/countries',            makeCrudRouter(countryCtrl));
router.use('/provinces',            makeCrudRouter(provinceCtrl));
router.use('/cities',               makeCrudRouter(cityCtrl));
router.use('/suburbs',              makeCrudRouter(suburbCtrl));
// ── Postal Codes — custom router (populates branchCode, has lookup-branch) ──
const pcRouter = express.Router();
pcRouter.use(protect);
pcRouter.get('/lookup-branch/:code',  lookupBranchByPostalCode);   // MUST be before /:id
pcRouter.get('/',                     getAllPostalCodes);
pcRouter.post('/',                    authorize(...WRITE), createPostalCode);
pcRouter.get('/:id',                  getPostalCodeById);
pcRouter.put('/:id',                  authorize(...WRITE), updatePostalCode);
pcRouter.delete('/:id',               authorize(...WRITE), deletePostalCode);
pcRouter.put('/:id/toggle-status',    authorize(...WRITE), togglePostalCodeStatus);

router.use('/postal-codes', pcRouter);
router.use('/payment-terms',        makeCrudRouter(paymentTermCtrl));
router.use('/payment-methods',      makeCrudRouter(paymentMethodCtrl));
router.use('/gl-accounts',          makeCrudRouter(glAccountCtrl));
router.use('/notification-templates', makeCrudRouter(notifTemplateCtrl));
router.use('/document-templates',   makeCrudRouter(docTemplateCtrl));
router.use('/vat-configs',          makeCrudRouter(vatConfigCtrl));
router.use('/rate-cards',           makeCrudRouter(rateCardCtrl));
router.use('/customer-types',       makeCrudRouter(customerTypeCtrl));

export default router;
