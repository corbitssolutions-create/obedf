import POD from '../models/POD.js';
import Waybill from '../models/Waybill.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['waybillNo', 'receiverName', 'driverName'];

/**
 * @desc    Get all PODs (paginated, searchable, filterable)
 * @route   GET /api/pod
 * @access  Protected
 */
export const getPODs = async (req, res, next) => {
  try {
    const result = await buildQuery(POD, req.query, SEARCH_FIELDS, {}, [
      { path: 'waybill', select: 'waybillNo sender receiver status' },
      { path: 'driver', select: 'fullName phoneNumber' },
      { path: 'capturedBy', select: 'fullName email' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single POD by ID
 * @route   GET /api/pod/:id
 * @access  Protected
 */
export const getPODById = async (req, res, next) => {
  try {
    const pod = await POD.findById(req.params.id)
      .populate('waybill', 'waybillNo sender receiver receiverAddress status quantity parcels')
      .populate('manifest', 'manifestNo route driver vehicle')
      .populate('driver', 'fullName phoneNumber licenseNumber')
      .populate('capturedBy', 'fullName email')
      .populate('verifiedBy', 'fullName email')
      .lean();

    if (!pod) {
      return res.status(404).json({ success: false, error: 'POD not found' });
    }

    res.status(200).json({ success: true, data: pod });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get POD by waybill number
 * @route   GET /api/pod/waybill/:waybillNo
 * @access  Protected
 */
export const getPODByWaybillNo = async (req, res, next) => {
  try {
    const pod = await POD.findOne({ waybillNo: req.params.waybillNo })
      .populate('waybill', 'waybillNo sender receiver status')
      .populate('driver', 'fullName phoneNumber')
      .lean();

    if (!pod) {
      return res.status(404).json({ success: false, error: 'No POD found for this waybill' });
    }

    res.status(200).json({ success: true, data: pod });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Capture / create a POD
 * @route   POST /api/pod
 * @access  Protected
 */
export const createPOD = async (req, res, next) => {
  try {
    const { waybillId, waybillNo, receiverName } = req.body;

    if (!waybillId && !waybillNo) {
      return res.status(400).json({ success: false, error: 'Waybill reference is required' });
    }

    // Resolve waybill
    const waybill = waybillId
      ? await Waybill.findById(waybillId)
      : await Waybill.findOne({ waybillNo });

    if (!waybill) {
      return res.status(404).json({ success: false, error: 'Waybill not found' });
    }

    // Check duplicate POD
    const existing = await POD.findOne({ waybill: waybill._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `POD already captured for waybill ${waybill.waybillNo}`,
      });
    }

    const pod = await POD.create({
      ...req.body,
      waybill: waybill._id,
      waybillNo: waybill.waybillNo,
      capturedBy: req.user?._id,
      status: 'Captured',
    });

    // Update waybill status to Delivered once POD is captured
    await Waybill.findByIdAndUpdate(waybill._id, { status: 'Delivered' });

    res.status(201).json({
      success: true,
      message: 'POD captured successfully',
      data: pod,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update POD (e.g. verify, add notes)
 * @route   PUT /api/pod/:id
 * @access  Protected
 */
export const updatePOD = async (req, res, next) => {
  try {
    const pod = await POD.findById(req.params.id);
    if (!pod) {
      return res.status(404).json({ success: false, error: 'POD not found' });
    }

    const updates = { ...req.body };

    // Track who verified
    if (updates.status === 'Verified' && pod.status !== 'Verified') {
      updates.verifiedBy = req.user?._id;
      updates.verifiedAt = new Date();
    }

    const updated = await POD.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'POD updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete POD
 * @route   DELETE /api/pod/:id
 * @access  Protected
 */
export const deletePOD = async (req, res, next) => {
  try {
    const pod = await POD.findById(req.params.id);
    if (!pod) {
      return res.status(404).json({ success: false, error: 'POD not found' });
    }

    await pod.deleteOne();
    res.status(200).json({ success: true, message: 'POD deleted successfully' });
  } catch (error) {
    next(error);
  }
};
