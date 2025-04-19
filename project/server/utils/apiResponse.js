/**
 * Standardized API Response Utilities
 * Provides consistent response format across the application
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 */
export const successResponse = (res, data, message = 'Success', status = 200) => {
  res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {*} errors - Additional error details
 */
export const errorResponse = (res, message = 'Internal Server Error', status = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(status).json(response);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message
 */
export const validationErrorResponse = (res, errors, message = 'Validation Error') => {
  res.status(422).json({
    success: false,
    message,
    errors
  });
};

/**
 * Send an unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  res.status(401).json({
    success: false,
    message
  });
};

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  res.status(403).json({
    success: false,
    message
  });
};

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  res.status(404).json({
    success: false,
    message
  });
};