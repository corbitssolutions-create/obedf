import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['registrationNumber', 'fleetNumber', 'make', 'model', 'vinNumber'];

/**
 * @desc    Get all vehicles (paginated, searchable, filterable)
 * @route   GET /api/vehicles
 * @access  Protected
 */
export const getVehicles = async (req, res, next) => {
  try {
    const result = await buildQuery(Vehicle, req.query, SEARCH_FIELDS, {}, [
      { path: 'currentDriver', select: 'fullName employeeId phoneNumber status' },
      { path: 'branch',        select: 'name code city' },
      { path: 'branches',      select: '_id code name' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns
 * @route   GET /api/vehicles/lookup
 * @access  Protected
 */
export const lookupVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: { $in: ['Active'] } })
      .select('_id registrationNumber fleetNumber make model vehicleType capacity status currentDriver')
      .populate('currentDriver', 'fullName')
      .sort({ registrationNumber: 1 })
      .lean();
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Protected
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('currentDriver', 'fullName employeeId phoneNumber status licenseNumber')
      .populate('branch', 'name code city')
      .populate('branches', '_id code name')
      .lean();

    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new vehicle
 * @route   POST /api/vehicles
 * @access  Protected
 */
export const createVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, vinNumber, fleetNumber } = req.body;

    if (!registrationNumber?.trim()) {
      return res.status(400).json({ success: false, error: 'Registration number is required' });
    }

    const regExists = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
    if (regExists) {
      return res.status(400).json({ success: false, error: `Vehicle '${registrationNumber}' already exists` });
    }

    if (vinNumber?.trim()) {
      const vinExists = await Vehicle.findOne({ vinNumber: vinNumber.trim() });
      if (vinExists) return res.status(400).json({ success: false, error: 'VIN number already registered' });
    }

    if (fleetNumber?.trim()) {
      const fleetExists = await Vehicle.findOne({ fleetNumber: fleetNumber.trim() });
      if (fleetExists) return res.status(400).json({ success: false, error: 'Fleet number already taken' });
    }

    // Auto-generate vehicleCode if not provided
    let vehicleCode = req.body.vehicleCode?.trim().toUpperCase();
    if (!vehicleCode) {
      const count = await Vehicle.countDocuments({});
      vehicleCode = `VEH-${String(count + 1).padStart(4, '0')}`;
      let suffix = count + 1;
      while (await Vehicle.findOne({ vehicleCode })) {
        suffix++;
        vehicleCode = `VEH-${String(suffix).padStart(4, '0')}`;
      }
    }

    // Clean vehicleType / fuelType — if they look like valid ObjectIds keep them,
    // otherwise store as plain string so we don't get cast errors
    const isObjectId = (v) => v && /^[a-f\d]{24}$/i.test(v);
    const vehicleType = isObjectId(req.body.vehicleType) ? req.body.vehicleType : (req.body.vehicleType || undefined);
    const fuelType    = isObjectId(req.body.fuelType)    ? req.body.fuelType    : (req.body.fuelType    || undefined);

    const vehicle = await Vehicle.create({
      ...req.body,
      vehicleCode,
      vehicleType,
      fuelType,
      createdBy: req.user?._id,
    });

    if (req.body.currentDriver) {
      await Driver.findByIdAndUpdate(req.body.currentDriver, { currentVehicle: vehicle._id });
    }

    res.status(201).json({ success: true, message: 'Vehicle created successfully', data: vehicle });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Protected
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const previousDriverId = vehicle.currentDriver?.toString();
    const newDriverId = req.body.currentDriver?.toString();

    const isObjectId = (v) => v && /^[a-f\d]{24}$/i.test(v);
    const updates = { ...req.body };
    if (updates.vehicleType !== undefined) {
      updates.vehicleType = isObjectId(updates.vehicleType) ? updates.vehicleType : (updates.vehicleType || undefined);
    }
    if (updates.fuelType !== undefined) {
      updates.fuelType = isObjectId(updates.fuelType) ? updates.fuelType : (updates.fuelType || undefined);
    }

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: false,  // skip re-validation for updates
    }).populate('currentDriver', 'fullName employeeId phoneNumber status');

    // Sync driver <-> vehicle relationship
    if (newDriverId && newDriverId !== previousDriverId) {
      if (previousDriverId) {
        await Driver.findByIdAndUpdate(previousDriverId, { $unset: { currentVehicle: 1 } });
      }
      await Driver.findByIdAndUpdate(newDriverId, { currentVehicle: vehicle._id });
    } else if (!newDriverId && previousDriverId) {
      await Driver.findByIdAndUpdate(previousDriverId, { $unset: { currentVehicle: 1 } });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Protected
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    // Unlink from driver
    if (vehicle.currentDriver) {
      await Driver.findByIdAndUpdate(vehicle.currentDriver, { $unset: { currentVehicle: 1 } });
    }

    await vehicle.deleteOne();

    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};
