import Manifest from '../models/Manifest.js';
import Waybill from '../models/Waybill.js';
import { getNextManifestNumber } from '../utils/counterHelper.js';

/**
 * Helper: validates waybills for manifest creation/update
 */
const validateWaybillsForManifest = async (waybillIds, currentManifestId = null) => {
  if (!waybillIds || waybillIds.length === 0) {
    return { valid: true, waybillsData: [], totalParcels: 0, totalWeight: 0 };
  }

  // Check for duplicates in the input array itself
  const uniqueIds = [...new Set(waybillIds)];
  if (uniqueIds.length !== waybillIds.length) {
    return { valid: false, error: 'Duplicate Waybills are not allowed in the manifest' };
  }

  // Fetch waybills
  const waybills = await Waybill.find({ _id: { $in: waybillIds } });

  if (waybills.length !== waybillIds.length) {
    return { valid: false, error: 'One or more Waybill identifiers are invalid or do not exist' };
  }

  let totalParcels = 0;
  let totalWeight = 0;

  for (const wb of waybills) {
    // Prevent closed waybills (e.g. Delivered or Cancelled)
    if (['Delivered', 'Cancelled'].includes(wb.status)) {
      return {
        valid: false,
        error: `Waybill ${wb.waybillNo} is already closed/delivered and cannot be added to a manifest`,
      };
    }

    // Calculate totals
    totalParcels += wb.quantity || 0;
    // Calculate total weight (sum of parcels actual weight, fallback to waybill level charges or weights)
    const waybillWeight = wb.parcels.reduce((sum, p) => sum + (p.weight || 0), 0);
    totalWeight += waybillWeight;
  }

  return { valid: true, waybillsData: waybills, totalParcels, totalWeight };
};

/**
 * @desc    Create a new Manifest
 * @route   POST /api/manifests
 * @access  Protected
 */
export const createManifest = async (req, res, next) => {
  try {
    const { driver, vehicle, route, subcontractor, waybills: waybillIds } = req.body;

    // 1. Generate unique sequential manifest ID
    const manifestNo = await getNextManifestNumber();

    // 2. Validate waybills pool
    const validation = await validateWaybillsForManifest(waybillIds || []);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // 3. Create Manifest
    // State lifecycle: Open -> On Delivery on creation save
    const manifest = await Manifest.create({
      manifestNo,
      date: new Date(), // Always today's date
      driver,
      vehicle,
      route,
      subcontractor,
      status: 'On Delivery', // Set to On Delivery immediately on save
      waybills: waybillIds || [],
      totalParcels: validation.totalParcels,
      totalWeight: Math.round(validation.totalWeight * 100) / 100,
    });

    res.status(201).json({
      success: true,
      message: 'Manifest created and status set to On Delivery',
      data: manifest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all manifests
 * @route   GET /api/manifests
 * @access  Protected
 */
export const getManifests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { manifestNo: { $regex: search, $options: 'i' } },
        { driver: { $regex: search, $options: 'i' } },
        { vehicle: { $regex: search, $options: 'i' } },
        { route: { $regex: search, $options: 'i' } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const skip = (options.page - 1) * options.limit;

    const total = await Manifest.countDocuments(query);
    const manifests = await Manifest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .populate('waybills')
      .lean();

    res.status(200).json({
      success: true,
      data: manifests,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single manifest details
 * @route   GET /api/manifests/:id
 * @access  Protected
 */
export const getManifestById = async (req, res, next) => {
  try {
    const manifest = await Manifest.findById(req.params.id)
      .populate('waybills')
      .lean();

    if (!manifest) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found',
      });
    }

    res.status(200).json({
      success: true,
      data: manifest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Manifest details
 * @route   PUT /api/manifests/:id
 * @access  Protected
 */
export const updateManifest = async (req, res, next) => {
  try {
    let manifest = await Manifest.findById(req.params.id);

    if (!manifest) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found',
      });
    }

    const updates = { ...req.body };
    delete updates.manifestNo;
    delete updates.date;

    // Validate waybills if they are being updated
    if (updates.waybills) {
      const validation = await validateWaybillsForManifest(updates.waybills, manifest._id);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }
      updates.totalParcels = validation.totalParcels;
      updates.totalWeight = Math.round(validation.totalWeight * 100) / 100;
    }

    manifest = await Manifest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Manifest updated successfully',
      data: manifest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a manifest
 * @route   DELETE /api/manifests/:id
 * @access  Protected
 */
export const deleteManifest = async (req, res, next) => {
  try {
    const manifest = await Manifest.findById(req.params.id);

    if (!manifest) {
      return res.status(404).json({
        success: false,
        error: 'Manifest not found',
      });
    }

    await manifest.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Manifest deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Scan parcel or waybill and resolve it to its parent Waybill
 * @route   POST /api/manifests/resolve-scan
 * @access  Protected
 */
export const resolveScan = async (req, res, next) => {
  try {
    const { barcode } = req.body;

    if (!barcode || String(barcode).trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Barcode scan value is required',
      });
    }

    const cleanBarcode = barcode.trim();
    let parentWaybill = null;
    let scanType = '';

    // Check if it's a direct Waybill scan or a Parcel scan
    const isParcelScan = cleanBarcode.includes('-');

    if (isParcelScan) {
      // Find parent waybill via the parcels.id index
      parentWaybill = await Waybill.findOne({ 'parcels.id': cleanBarcode });
      scanType = 'parcel';
    } else {
      // Find directly by Waybill Number
      parentWaybill = await Waybill.findOne({ waybillNo: cleanBarcode });
      scanType = 'waybill';
    }

    if (!parentWaybill) {
      return res.status(400).json({
        success: false,
        error: `Barcode '${cleanBarcode}' did not match any active Waybills or Parcels in the database`,
      });
    }

    // Validate Waybill status constraints
    if (['Delivered', 'Cancelled'].includes(parentWaybill.status)) {
      return res.status(400).json({
        success: false,
        error: `Waybill ${parentWaybill.waybillNo} associated with this barcode is already closed/delivered`,
      });
    }

    const waybillWeight = parentWaybill.parcels.reduce((sum, p) => sum + (p.weight || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Barcode resolved successfully',
      data: {
        scanType,
        barcode: cleanBarcode,
        waybill: {
          id: parentWaybill._id,
          waybillNo: parentWaybill.waybillNo,
          receiver: parentWaybill.receiver,
          parcelsCount: parentWaybill.quantity,
          totalWeight: Math.round(waybillWeight * 100) / 100,
          status: parentWaybill.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
