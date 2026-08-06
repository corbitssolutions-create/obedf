import mongoose from 'mongoose';

/**
 * Validate email format using standard regex
 */
export const isValidEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength (at least 6 characters, contains letters and numbers)
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Middleware: Validate login input
 */
export const validateLogin = (req, res, next) => {
  const { username, password, branch } = req.body;

  if (!username || String(username).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Username or Email is required',
    });
  }

  if (!password || String(password).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Password is required',
    });
  }

  // Branch validation (optional but matches frontend's drop-down)
  if (!branch || String(branch).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Branch selection is required',
    });
  }

  next();
};

/**
 * Middleware: Validate password change input
 */
export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || String(currentPassword).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Current password is required',
    });
  }

  if (!newPassword || String(newPassword).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'New password is required',
    });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 6 characters long',
    });
  }

  next();
};

/**
 * Middleware: Validate forgot password input
 */
export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || String(email).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Email address is required',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address',
    });
  }

  next();
};

/**
 * Middleware: Validate reset password input
 */
export const validateResetPassword = (req, res, next) => {
  const { password, token } = req.body;

  if (!token || String(token).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Reset token is required',
    });
  }

  if (!password || String(password).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'New password is required',
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long',
    });
  }

  next();
};

/**
 * Helper middleware to validate MongoDB ObjectIds
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName] || req.body[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid database identifier: ${paramName}`,
      });
    }
    next();
  };
};
