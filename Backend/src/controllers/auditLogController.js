import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Get audit logs (paginated, filterable by event type, user, date range)
 * @route   GET /api/audit-logs
 * @access  Protected (Admin+)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      event,
      userId,
      search,
      from,
      to,
      sort = 'timestamp:desc',
    } = req.query;

    const filter = {};

    if (event) filter.event = event;
    if (userId) filter.userId = userId;

    // Date range filter on timestamp
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = toDate;
      }
    }

    // Full-text search on message field
    if (search) {
      filter.message = { $regex: search, $options: 'i' };
    }

    // Sort parsing
    const [sortField, sortDir] = sort.split(':');
    const sortBy = { [sortField || 'timestamp']: sortDir === 'asc' ? 1 : -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName email role')
      .lean();

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single audit log entry
 * @route   GET /api/audit-logs/:id
 * @access  Protected (Admin+)
 */
export const getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('userId', 'fullName email role')
      .lean();

    if (!log) {
      return res.status(404).json({ success: false, error: 'Audit log entry not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all distinct event types (for filter dropdowns)
 * @route   GET /api/audit-logs/events
 * @access  Protected (Admin+)
 */
export const getAuditEventTypes = async (req, res, next) => {
  try {
    const events = await AuditLog.distinct('event');
    res.status(200).json({ success: true, data: events.sort() });
  } catch (error) {
    next(error);
  }
};
