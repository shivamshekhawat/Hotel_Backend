/**
 * Validation middleware factory
 * @param {Function} validator - Joi validation function
 * @param {String} property - Request property to validate (body, query, params)
 * @returns {Function} Express middleware
 */
function validate(validator, property = 'body') {
  return (req, res, next) => {
    const { error, value } = validator(req[property]);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
        details: error.details
      });
    }
    
    // Replace the original property with validated and sanitized data
    req[property] = value;
    next();
  };
}

/**
 * Validate request body
 */
function validateBody(validator) {
  return validate(validator, 'body');
}

/**
 * Validate query parameters
 */
function validateQuery(validator) {
  return validate(validator, 'query');
}

/**
 * Validate route parameters
 */
function validateParams(validator) {
  return validate(validator, 'params');
}

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};
