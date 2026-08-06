import Branch from '../models/Branch.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['name', 'code', 'city', 'province', 'managerName', 'phoneNumber', 'email'];

/**
 * @desc    Public branch list for login page dropdown — NO auth required.
 *          Only returns _id, code, name, isHeadOffice. Excludes all sensitive fields.
 * @route   GET /api/branches/public
 * @access  PUBLIC
 */
export const getPublicBranches = async (req, res, next) => {
  try {
    const filter = { status: 'Active' };

    const branches = await Branch.find(filter)
      .select('_id code name isHeadOffice')   // only safe fields
      .sort({ isHeadOffice: -1, name: 1 })    // head office first, then alphabetical
      .lean();

    res.status(200).json({ success: true, branches });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all branches (paginated, searchable, filterable)
 * @route   GET /api/branches
 * @access  Protected
 */
export const getBranches = async (req, res, next) => {
  try {
    const result = await buildQuery(Branch, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns
 * @route   GET /api/branches/lookup
 * @access  Protected
 */
export const lookupBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ status: 'Active' })
      .select('_id name code city province isHeadOffice')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single branch
 * @route   GET /api/branches/:id
 * @access  Protected
 */
export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).lean();
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new branch
 * @route   POST /api/branches
 * @access  Protected
 */
export const createBranch = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    if (await Branch.findOne({ name: name?.trim() })) {
      return res.status(400).json({ success: false, error: `Branch '${name}' already exists` });
    }
    if (code && await Branch.findOne({ code: code?.toUpperCase().trim() })) {
      return res.status(400).json({ success: false, error: `Branch code '${code}' already in use` });
    }

    const branch = await Branch.create({ ...req.body, createdBy: req.user?._id });

    res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update branch
 * @route   PUT /api/branches/:id
 * @access  Protected
 */
export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Branch updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete branch
 * @route   DELETE /api/branches/:id
 * @access  Protected
 */
export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    if (branch.isHeadOffice) {
      return res.status(400).json({ success: false, error: 'Head office branch cannot be deleted' });
    }

    await branch.deleteOne();
    res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    next(error);
  }
};
