import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import app from './src/app.js';
import seedAdmin from './src/config/seedAdmin.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, async () => {
  logger.info(`================================
Freight Flow Backend Started
Port: ${PORT}
Environment: ${NODE_ENV}
================================`);

  // Log server startup in audit log
  await logger.audit('SERVER_STARTUP', `Freight Flow Backend started on port ${PORT} in ${NODE_ENV} environment`);

  // Connect to Database & seed
  try {
    await connectDB();
    await seedAdmin();

    // ── Migrate: rename legacy 'Viewer' role → 'Operation Manager' ───────────────
    try {
      const { default: User } = await import('./src/models/User.js');
      const result = await User.updateMany(
        { role: 'Viewer' },
        { $set: { role: 'Operation Manager' } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`[MIGRATE] ${result.modifiedCount} user(s) migrated from Viewer → Operation Manager`);
      }
    } catch (e) {
      console.warn('[MIGRATE] Role migration skipped:', e.message);
    }
  } catch (err) {
    logger.error('Startup initialization failed:', err);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection Error: ${err.message}`, err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
