import AuditLog from '../models/AuditLog.js';

/**
 * Log levels and utility functions
 */
const logger = {
  info: (message, details = null) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  },

  warn: (message, details = null) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  },

  error: (message, err = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, err || '');
  },

  /**
   * System-level and security audit logger
   */
  audit: async (event, message, userId = null, ipAddress = null, userAgent = null, details = null) => {
    try {
      // Print to console
      console.log(`[AUDIT - ${event}] ${message}`);

      // Save to database AuditLog collection
      await AuditLog.create({
        event,
        message,
        userId,
        ipAddress,
        userAgent,
        details,
      });
    } catch (error) {
      console.error('Failed to write audit log to database:', error.message);
    }
  },
};

export default logger;
