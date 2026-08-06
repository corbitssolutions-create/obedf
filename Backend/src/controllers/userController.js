import User from '../models/User.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['fullName', 'email', 'username', 'department', 'phoneNumber'];

/**
 * @desc    Get all users (paginated, searchable, filterable)
 * @route   GET /api/users
 * @access  Protected
 */
export const getUsers = async (req, res, next) => {
  try {
    const result = await buildQuery(User, req.query, SEARCH_FIELDS, {}, [
      { path: 'branches', select: '_id code name' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lightweight list for dropdowns
 * @route   GET /api/users/lookup
 * @access  Protected
 */
export const lookupUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'Active' })
      .select('_id fullName email username role department')
      .sort({ fullName: 1 })
      .lean();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Protected
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('branches', '_id code name')
      .populate('createdBy', 'fullName email')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Protected
 */
export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, username, password, role, department, phoneNumber, status } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: 'Full name and email are required' });
    }

    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password is required and must be at least 6 characters' });
    }

    if (await User.findOne({ email: email.toLowerCase().trim() })) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    if (username && username.trim() !== '') {
      if (await User.findOne({ username: username.toLowerCase().trim() })) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password,
      role: role || 'Operation Manager',
      department: department || 'Operations',
      phoneNumber,
      branches: Array.isArray(req.body.branches) ? req.body.branches : [],
      status: status || 'Active',
      createdBy: req.user?._id,
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userObj });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/users/:id
 * @access  Protected
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Never allow password update via this endpoint — use /auth/change-password
    const updates = { ...req.body };
    delete updates.password;
    delete updates.resetPasswordToken;
    delete updates.resetPasswordExpire;
    delete updates.loginAttempts;

    // Email uniqueness check (if email is being changed)
    if (updates.email && updates.email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: updates.email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use by another account' });
      }
      updates.email = updates.email.toLowerCase().trim();
    }

    // Username uniqueness check
    if (updates.username && updates.username.trim() !== '' && updates.username.trim() !== user.username) {
      const usernameExists = await User.findOne({ username: updates.username.toLowerCase().trim() });
      if (usernameExists) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
      updates.username = updates.username.toLowerCase().trim();
    }

    updates.updatedBy = req.user?._id;

    const updated = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    const userObj = { ...updated };
    delete userObj.password;

    res.status(200).json({ success: true, message: 'User updated successfully', data: userObj });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Protected
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.email === 'admin@freightflow.com') {
      return res.status(400).json({
        success: false,
        error: 'The primary system administrator cannot be deleted',
      });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
