import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getCompany, getCompanyDefaults, createCompany, updateCompany, uploadLogo,
  addDepartment, removeDepartment, addCostCentre, addBusinessUnit,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const ADMIN = ['Super Admin', 'Administrator'];

// ── Multer setup for logo uploads ─────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `company-logo-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|svg|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

// ── Static file serving for uploaded logos ────────────────────────────────
router.use('/static', express.static(path.join(process.cwd(), 'public')));

router.use(protect);

// Logo upload (must be before /:id param routes)
router.post('/upload-logo', authorize(...ADMIN), upload.single('logo'), uploadLogo);

// Waybill defaults endpoint (must be before /:id to avoid Express conflict)
router.get('/defaults', getCompanyDefaults);

router.get('/',    getCompany);
router.post('/',   authorize(...ADMIN), createCompany);
router.put('/:id', authorize(...ADMIN), updateCompany);

router.post('/:id/departments',           authorize(...ADMIN), addDepartment);
router.delete('/:id/departments/:deptId', authorize(...ADMIN), removeDepartment);
router.post('/:id/cost-centres',          authorize(...ADMIN), addCostCentre);
router.post('/:id/business-units',        authorize(...ADMIN), addBusinessUnit);

export default router;
