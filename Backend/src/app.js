import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import errorHandler from './middleware/errorHandler.js';

// ── Existing routes ──────────────────────────────────────────────────────────
import authRoutes           from './routes/authRoutes.js';
import dashboardRoutes      from './routes/dashboardRoutes.js';
import customerRoutes       from './routes/customerRoutes.js';
import waybillRoutes        from './routes/waybillRoutes.js';
import manifestRoutes       from './routes/manifestRoutes.js';
import userRoutes           from './routes/userRoutes.js';
import driverRoutes         from './routes/driverRoutes.js';
import vehicleRoutes        from './routes/vehicleRoutes.js';
import contractorRoutes     from './routes/contractorRoutes.js';
import branchRoutes         from './routes/branchRoutes.js';
import routeRoutes          from './routes/routeRoutes.js';
import podRoutes            from './routes/podRoutes.js';
import notificationRoutes   from './routes/notificationRoutes.js';
import auditLogRoutes       from './routes/auditLogRoutes.js';

// ── New base-data routes ──────────────────────────────────────────────────────
import lookupRoutes         from './routes/lookupRoutes.js';
import companyRoutes        from './routes/companyRoutes.js';
import billingAccountRoutes from './routes/billingAccountRoutes.js';
import supplierRoutes       from './routes/supplierRoutes.js';
import trailerRoutes        from './routes/trailerRoutes.js';
import exchangeRateRoutes   from './routes/exchangeRateRoutes.js';
import ratingRoutes         from './routes/ratingRoutes.js';

const app = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return cb(null, true);
    }
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests — try again in 15 minutes' },
  standardHeaders: true, legacyHeaders: false,
}));

// ── Body / cookie parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging & compression ─────────────────────────────────────────────────────
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));
app.use(compression());

// ── Static files (uploaded logos etc.) ───────────────────────────────────
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import pathModule from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = pathModule.dirname(__filename);
app.use('/uploads', express.static(pathModule.join(__dirname, '../../public/uploads')));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ success: true, message: 'FreightFlow TMS API' }));
app.get('/api/health', (_, res) => {
  const states = { 0:'disconnected',1:'connected',2:'connecting',3:'disconnecting' };
  res.json({ status:'ok', database: states[mongoose.connection.readyState] || 'unknown', time: new Date() });
});

// ── Existing API routes ───────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/customers',       customerRoutes);
app.use('/api/waybills',        waybillRoutes);
app.use('/api/manifests',       manifestRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/drivers',         driverRoutes);
app.use('/api/vehicles',        vehicleRoutes);
app.use('/api/contractors',     contractorRoutes);
app.use('/api/branches',        branchRoutes);
app.use('/api/routes',          routeRoutes);
app.use('/api/pod',             podRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/audit-logs',      auditLogRoutes);

// ── New base-data API routes ───────────────────────────────────────────────────
// All lookup/master tables mount under /api/master
app.use('/api/master',          lookupRoutes);
app.use('/api/company',         companyRoutes);
app.use('/api/billing-accounts',billingAccountRoutes);
app.use('/api/suppliers',       supplierRoutes);
app.use('/api/trailers',        trailerRoutes);
app.use('/api/exchange-rates',  exchangeRateRoutes);
app.use('/api/ratings',         ratingRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, _, next) => {
  const err = new Error(`Not Found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
