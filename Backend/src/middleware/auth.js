import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Route protection middleware - verifies JWT token from Authorization Header or Cookies
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Get token from Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Get token from HTTP-only Cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token is missing.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');

    // Fetch user and attach to request
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.',
      });
    }

    // Check if user is active
    if (req.user.status === 'Inactive') {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently deactivated. Please contact support.',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token is invalid or expired.',
    });
  }
};

/**
 * Route authorization middleware - restricts access to specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};
