const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Database errors
  if (err.code === 'ER_DUP_ENTRY' || err.number === 2627) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'Resource already exists'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please login again'
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'Database connection failed'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Handle 404 errors
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
