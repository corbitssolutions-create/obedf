import Waybill from '../models/Waybill.js';
import Customer from '../models/Customer.js';
import Manifest from '../models/Manifest.js';
import AuditLog from '../models/AuditLog.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import POD from '../models/POD.js';

/**
 * @desc    Get dashboard counts & general operational metrics
 * @route   GET /api/dashboard/stats
 * @access  Protected
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Run all counts in parallel for speed
    const [
      totalWaybills,
      totalCustomers,
      totalManifests,
      openManifests,
      deliveredWaybills,
      outstandingWaybills,
      failedWaybills,
      totalVehicles,
      activeVehicles,
      totalDrivers,
      activeDrivers,
      podsOutstanding,
    ] = await Promise.all([
      Waybill.countDocuments({}),
      Customer.countDocuments({}),
      Manifest.countDocuments({}),
      Manifest.countDocuments({ status: 'Open' }),
      Waybill.countDocuments({ status: 'Delivered' }),
      Waybill.countDocuments({ status: 'Outstanding' }),
      Waybill.countDocuments({ status: 'Failed' }),
      Vehicle.countDocuments({}),
      Vehicle.countDocuments({ status: 'Active' }),
      Driver.countDocuments({}),
      Driver.countDocuments({ status: { $in: ['Available', 'On Trip'] } }),
      POD.countDocuments({ status: { $in: ['Pending', 'Captured'] } }),
    ]);

    const successRate = totalWaybills > 0
      ? Math.round((deliveredWaybills / totalWaybills) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalWaybills,
        totalCustomers,
        totalManifests,
        openManifests,
        deliveredWaybills,
        outstandingWaybills,
        failedWaybills,
        totalVehicles,
        activeVehicles,
        totalDrivers,
        activeDrivers,
        podsOutstanding,
        successRate: `${successRate}%`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent system/audit activities
 * @route   GET /api/dashboard/recent-activity
 * @access  Protected
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const activities = await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'fullName email role')
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get latest waybills registered in the system
 * @route   GET /api/dashboard/latest-waybills
 * @access  Protected
 */
export const getLatestWaybills = async (req, res, next) => {
  try {
    const waybills = await Waybill.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      data: waybills,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get distribution counts of waybills by status
 * @route   GET /api/dashboard/shipment-status
 * @access  Protected
 */
export const getShipmentStatus = async (req, res, next) => {
  try {
    const statusDistribution = await Waybill.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedData = {};
    // Seed all possible statuses with 0
    ['Draft', 'Active', 'Cancelled', 'Delivered', 'Outstanding', 'Failed'].forEach((status) => {
      formattedData[status] = 0;
    });

    statusDistribution.forEach((item) => {
      if (item._id) {
        formattedData[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get total accumulated revenue (aggregated charges sum)
 * @route   GET /api/dashboard/revenue
 * @access  Protected
 */
export const getRevenue = async (req, res, next) => {
  try {
    const revenueAggregation = await Waybill.aggregate([
      {
        $project: {
          cleanCharges: {
            $cond: {
              if: { $eq: [{ $type: '$charges' }, 'string'] },
              then: { $replaceAll: { input: '$charges', find: 'R', replacement: '' } },
              else: '$charges',
            },
          },
        },
      },
      {
        $project: {
          numericCharges: {
            $convert: {
              input: '$cleanCharges',
              to: 'double',
              onError: 0.0,
              onNull: 0.0,
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$numericCharges' },
        },
      },
    ]);

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency: 'ZAR',
      },
    });
  } catch (error) {
    next(error);
  }
};
