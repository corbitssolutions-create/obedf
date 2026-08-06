import Contractor from '../models/Contractor.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['name', 'companyRegistration', 'contactPerson', 'phoneNumber', 'email'];

/**
 * @desc    Get all contractors (paginated, searchable, filterable)
 * @route   GET /api/contractors
 * @access  Protected
 */
export const getContractors = async (req, res, next) => {
  try {
    const result = await buildQuery(Contractor, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns
 * @route   GET /api/contractors/lookup
 * @access  Protected
 */
export const lookupContractors = async (req, res, next) => {
  try {
    const contractors = await Contractor.find({ status: 'Active' })
      .select('_id name contactPerson phoneNumber email serviceRegions')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: contractors });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single contractor by ID
 * @route   GET /api/contractors/:id
 * @access  Protected
 */
export const getContractorById = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id).lean();
    if (!contractor) {
      return res.status(404).json({ success: false, error: 'Contractor not found' });
    }
    res.status(200).json({ success: true, data: contractor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new contractor
 * @route   POST /api/contractors
 * @access  Protected
 */
export const createContractor = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existing = await Contractor.findOne({ name: name?.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Contractor with name '${name}' already exists`,
      });
    }

    const contractor = await Contractor.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: 'Contractor created successfully',
      data: contractor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update contractor
 * @route   PUT /api/contractors/:id
 * @access  Protected
 */
export const updateContractor = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ success: false, error: 'Contractor not found' });
    }

    const updated = await Contractor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Contractor updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete contractor
 * @route   DELETE /api/contractors/:id
 * @access  Protected
 */
export const deleteContractor = async (req, res, next) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (!contractor) {
      return res.status(404).json({ success: false, error: 'Contractor not found' });
    }

    await contractor.deleteOne();

    res.status(200).json({ success: true, message: 'Contractor deleted successfully' });
  } catch (error) {
    next(error);
  }
};
