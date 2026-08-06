/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for dev troubleshooting
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Mongoose CastError (e.g., invalid ObjectId format)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const friendlyNames = {
      routeCode:          'Route Code',
      registrationNumber: 'Registration Number',
      licenseNumber:      'License Number',
      email:              'Email',
      username:           'Username',
      customerCode:       'Customer Code',
      vehicleCode:        'Vehicle Code',
      trailerCode:        'Trailer Code',
      supplierCode:       'Supplier Code',
      billingAccountCode: 'Billing Account Code',
      code:               'Code',
      name:               'Name',
    };
    const fieldLabel = friendlyNames[field] || field;
    const message = `"${value}" is already in use for ${fieldLabel}. Please choose a different value.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new Error(message);
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new Error(message);
    error.statusCode = 401;
  }

  // Default response values
  const statusCode = error.statusCode || err.statusCode || 500;
  const statusMessage = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: statusMessage,
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
