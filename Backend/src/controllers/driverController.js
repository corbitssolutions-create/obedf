import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['fullName', 'employeeId', 'licenseNumber', 'phoneNumber', 'email', 'idNumber'];

/**
 * @desc    Get all drivers (paginated, searchable, filterable)
 * @route   GET /api/drivers
 * @access  Protected
 */
export const getDrivers = async (req, res, next) => {
  try {
    const result = await buildQuery(Driver, req.query, SEARCH_FIELDS, {}, [
      { path: 'currentVehicle', select: 'registrationNumber make model status' },
      { path: 'branch',         select: 'name code city' },
      { path: 'branches',       select: '_id code name' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns
 * @route   GET /api/drivers/lookup
 * @access  Protected
 */
export const lookupDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({ status: { $ne: 'Suspended' } })
      .select('_id fullName employeeId licenseNumber phoneNumber status currentVehicle')
      .populate('currentVehicle', 'registrationNumber')
      .sort({ fullName: 1 })
      .lean();
    res.status(200).json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single driver by ID
 * @route   GET /api/drivers/:id
 * @access  Protected
 */
export const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('currentVehicle', 'registrationNumber make model status')
      .populate('branch', 'name code city')
      .populate('branches', '_id code name')
      .lean();

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new driver
 * @route   POST /api/drivers
 * @access  Protected
 */
export const createDriver = async (req, res, next) => {
  try {
    const { licenseNumber, idNumber, employeeId } = req.body;

    // Duplicate license check
    const licenseExists = await Driver.findOne({ licenseNumber: licenseNumber?.trim() });
    if (licenseExists) {
      return res.status(400).json({
        success: false,
        error: `Driver with license number '${licenseNumber}' already exists`,
      });
    }

    // Duplicate ID number check
    if (idNumber && idNumber.trim() !== '') {
      const idExists = await Driver.findOne({ idNumber: idNumber.trim() });
      if (idExists) {
        return res.status(400).json({ success: false, error: 'A driver with this ID number already exists' });
      }
    }

    // Duplicate employee ID check
    if (employeeId && employeeId.trim() !== '') {
      const empExists = await Driver.findOne({ employeeId: employeeId.trim() });
      if (empExists) {
        return res.status(400).json({ success: false, error: 'Employee ID already taken' });
      }
    }

    const driver = await Driver.create({
      ...req.body,
      branches: Array.isArray(req.body.branches) ? req.body.branches : [],
      createdBy: req.user?._id,
    });

    // If a vehicle is assigned, update vehicle.currentDriver
    if (req.body.currentVehicle) {
      await Vehicle.findByIdAndUpdate(req.body.currentVehicle, { currentDriver: driver._id });
    }

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update driver
 * @route   PUT /api/drivers/:id
 * @access  Protected
 */
export const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const previousVehicleId = driver.currentVehicle?.toString();
    const newVehicleId = req.body.currentVehicle?.toString();

    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('currentVehicle', 'registrationNumber make model status');

    // Sync vehicle <-> driver relationship when vehicle changes
    if (newVehicleId && newVehicleId !== previousVehicleId) {
      // Remove driver from old vehicle
      if (previousVehicleId) {
        await Vehicle.findByIdAndUpdate(previousVehicleId, { $unset: { currentDriver: 1 } });
      }
      // Assign driver to new vehicle
      await Vehicle.findByIdAndUpdate(newVehicleId, { currentDriver: driver._id });
    } else if (!newVehicleId && previousVehicleId) {
      // Driver unassigned from vehicle
      await Vehicle.findByIdAndUpdate(previousVehicleId, { $unset: { currentDriver: 1 } });
    }

    res.status(200).json({
      success: true,
      message: 'Driver updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete driver
 * @route   DELETE /api/drivers/:id
 * @access  Protected
 */
export const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    // Unlink from vehicle
    if (driver.currentVehicle) {
      await Vehicle.findByIdAndUpdate(driver.currentVehicle, { $unset: { currentDriver: 1 } });
    }

    await driver.deleteOne();

    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
  } catch (error) {
    next(error);
  }
};
