import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Helper: Generate JWT token and set in cookie/response
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        department: user.department,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        status: user.status,
        branches: (user.branches || []).map((b) => ({
          _id: b._id, code: b.code, name: b.name,
        })),
      },
    });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  const { username, password, branch } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    // Lookup by username or email
    const query = username.includes('@')
      ? { email: username.toLowerCase().trim() }
      : { username: username.trim() };

    const user = await User.findOne(query).select('+password').populate('branches', '_id code name');

    if (!user) {
      await logger.audit('LOGIN_FAILED', `Login failed: User not found for login name '${username}'`, null, ipAddress, userAgent, { username, branch });
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check account status
    if (user.status === 'Inactive') {
      await logger.audit('LOGIN_FAILED', `Login failed: Account is inactive for user '${user.email}'`, user._id, ipAddress, userAgent, { branch });
      return res.status(403).json({
        success: false,
        error: 'Your account is deactivated. Please contact support.',
      });
    }

    // ── Branch restriction check ─────────────────────────────────────────────
    // If user has assigned branches, they MUST login from one of those branches.
    // Empty branches array = no restriction.
    if (user.branches && user.branches.length > 0) {
      const selectedBranch = (branch || '').toLowerCase().trim();

      if (!selectedBranch) {
        return res.status(403).json({
          success: false,
          error: 'Please select your assigned branch to continue.',
        });
      }

      const allowed = user.branches.some((b) => {
        const byId   = b._id.toString() === branch;
        const byName = b.name?.toLowerCase().trim() === selectedBranch;
        const byCode = b.code?.toLowerCase().trim() === selectedBranch;
        return byId || byName || byCode;
      });

      if (!allowed) {
        const assignedNames = user.branches.map((b) => b.name).join(', ');
        await logger.audit(
          'LOGIN_FAILED',
          `Login failed: Branch mismatch for user '${user.email}'. Assigned: '${assignedNames}', Attempted: '${branch}'`,
          user._id, ipAddress, userAgent,
          { assignedBranches: assignedNames, attemptedBranch: branch }
        );
        return res.status(403).json({
          success: false,
          error: `Access denied. You are assigned to: ${assignedNames}. Please select the correct branch.`,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      await user.save();

      await logger.audit(
        'LOGIN_FAILED',
        `Login failed: Incorrect password for user '${user.email}'. Attempts: ${user.loginAttempts}`,
        user._id,
        ipAddress,
        userAgent,
        { branch, loginAttempts: user.loginAttempts }
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Reset login attempts and record last login
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    await logger.audit('LOGIN_SUCCESS', `User logged in successfully: ${user.email} (Branch: ${branch || 'Default'})`, user._id, ipAddress, userAgent, { branch });

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const logout = async (req, res, next) => {
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    await logger.audit('LOGOUT', `User logged out: ${req.user.email}`, req.user.id, ipAddress, userAgent);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // expire in 10s
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged in user info
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        department: req.user.department,
        profileImage: req.user.profileImage,
        phoneNumber: req.user.phoneNumber,
        status: req.user.status,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Protected
 */
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    const user = await User.findById(req.user.id).select('+password');

    // Confirm current password matches
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect current password',
      });
    }

    // Set new password (will be hashed automatically by user Schema pre-save)
    user.password = newPassword;
    await user.save();

    await logger.audit('PASSWORD_CHANGED', `Password changed successfully for user: ${user.email}`, user._id, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password - initiates recovery
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'There is no user registered with that email address',
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    await logger.audit(
      'PASSWORD_RESET_REQUEST',
      `Password reset token generated for user: ${user.email}`,
      user._id,
      ipAddress,
      userAgent
    );

    // Normally we'd email this. For verification/development, we return it in response.
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken, // Included for testing and verification
      instruction: `Submit a POST request to /api/auth/reset-password with fields 'token' (value: '${resetToken}') and 'password' (your new password)`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using recovery token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    // Hash token to compare with DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logger.audit(
      'PASSWORD_RESET_SUCCESS',
      `Password reset successful for user: ${user.email}`,
      user._id,
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};
