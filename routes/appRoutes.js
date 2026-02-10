const express = require('express');
const router = express.Router();
const {
  registerApp,
  getDeveloperApps,
  getAppDetails,
  updateApp,
  regenerateApiKey,
  deleteApp,
  getAppStats
} = require('../controllers/appController');
const {
  validateAppRegistration,
  validatePackageName,
  validateDeveloper
} = require('../middleware');

/**
 * @route   POST /api/apps/register
 * @desc    Register a new app
 * @access  Private (Developer)
 */
router.post('/register', validateDeveloper, validateAppRegistration, registerApp);

/**
 * @route   GET /api/apps
 * @desc    Get all apps for a developer
 * @access  Private (Developer)
 */
router.get('/', validateDeveloper, getDeveloperApps);

/**
 * @route   GET /api/apps/:packageName
 * @desc    Get single app details
 * @access  Private (Developer)
 */
router.get('/:packageName', validateDeveloper, validatePackageName, getAppDetails);

/**
 * @route   PUT /api/apps/:packageName
 * @desc    Update app details
 * @access  Private (Developer)
 */
router.put('/:packageName', validateDeveloper, validatePackageName, updateApp);

/**
 * @route   POST /api/apps/:packageName/regenerate-key
 * @desc    Regenerate API key for an app
 * @access  Private (Developer)
 */
router.post('/:packageName/regenerate-key', validateDeveloper, validatePackageName, regenerateApiKey);

/**
 * @route   GET /api/apps/:packageName/stats
 * @desc    Get app statistics
 * @access  Private (Developer)
 */
router.get('/:packageName/stats', validateDeveloper, validatePackageName, getAppStats);

/**
 * @route   DELETE /api/apps/:packageName
 * @desc    Delete an app
 * @access  Private (Developer)
 */
router.delete('/:packageName', validateDeveloper, validatePackageName, deleteApp);

module.exports = router;
