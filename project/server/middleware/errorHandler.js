/**
 * Global Error Handler Middleware
 */

import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Validation Error', 422, err.errors);
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    return errorResponse(res, 'Duplicate Entry', 409);
  }

  // JWT Authentication Error
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  // JWT Token Expired Error
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Default Error Response
  return errorResponse(
    res,
    err.message || 'Internal Server Error',
    err.status || 500
  );
};

// 404 Handler
export const notFoundHandler = (req, res) => {
  errorResponse(res, `Route not found: ${req.originalUrl}`, 404);
};