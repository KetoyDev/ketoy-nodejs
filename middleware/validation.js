const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for developer registration
 */
const validateDeveloperRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('contactDetails.phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('contactDetails.company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name must not exceed 200 characters'),
  body('contactDetails.website')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  handleValidationErrors
];

/**
 * Validation rules for app registration
 */
const validateAppRegistration = [
  body('packageName')
    .trim()
    .notEmpty()
    .withMessage('Package name is required')
    .matches(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
    .withMessage('Invalid package name format (e.g., com.example.app)'),
  body('appName')
    .trim()
    .notEmpty()
    .withMessage('App name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('App name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('metadata.version')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Version must be in format x.y.z'),
  body('metadata.platform')
    .optional()
    .isIn(['android', 'ios', 'both'])
    .withMessage('Platform must be android, ios, or both'),
  handleValidationErrors
];

/**
 * Validation rules for screen upload
 */
const validateScreenUpload = [
  body('screenName')
    .trim()
    .notEmpty()
    .withMessage('Screen name is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Screen name can only contain letters, numbers, hyphens, and underscores')
    .isLength({ min: 2, max: 100 })
    .withMessage('Screen name must be between 2 and 100 characters'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Display name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('jsonContent')
    .notEmpty()
    .withMessage('JSON content is required')
    .custom((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        throw new Error('Invalid JSON content');
      }
    }),
  body('version')
    .optional()
    .matches(/^\d+\.\d+\.\d+$/)
    .withMessage('Version must be in format x.y.z'),
  body('metadata.category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  body('metadata.tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors
];

/**
 * Validation rules for screen retrieval
 */
const validateScreenRetrieval = [
  query('screen_name')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid screen name format'),
  param('screenName')
    .optional()
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid screen name format'),
  handleValidationErrors
];

/**
 * Validation rules for package name parameter
 */
const validatePackageName = [
  param('packageName')
    .trim()
    .matches(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/)
    .withMessage('Invalid package name format'),
  handleValidationErrors
];

module.exports = {
  validateDeveloperRegistration,
  validateAppRegistration,
  validateScreenUpload,
  validateScreenRetrieval,
  validatePackageName,
  handleValidationErrors
};
