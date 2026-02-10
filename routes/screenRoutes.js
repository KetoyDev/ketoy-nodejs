const express = require('express');
const router = express.Router();
const {
  uploadScreen,
  updateScreen,
  getAppScreens,
  getScreenDetails,
  deleteScreen,
  getScreenJson
} = require('../controllers/screenController');
const {
  validateScreenUpload,
  validateScreenRetrieval,
  validatePackageName,
  validateDeveloper,
  validateApiKey,
  scanJsonContent
} = require('../middleware');

/**
 * Developer Routes (Management)
 */

/**
 * @route   POST /api/screens/:packageName/upload
 * @desc    Upload/Create a new screen
 * @access  Private (Developer)
 */
router.post(
  '/:packageName/upload',
  validateDeveloper,
  validatePackageName,
  validateScreenUpload,
  scanJsonContent,
  uploadScreen
);

/**
 * @route   GET /api/screens/:packageName
 * @desc    Get all screens for an app
 * @access  Private (Developer)
 */
router.get('/:packageName', validateDeveloper, validatePackageName, getAppScreens);

/**
 * @route   GET /api/screens/:packageName/:screenName/details
 * @desc    Get screen details (for developer)
 * @access  Private (Developer)
 */
router.get(
  '/:packageName/:screenName/details',
  validateDeveloper,
  validatePackageName,
  getScreenDetails
);

/**
 * @route   PUT /api/screens/:packageName/:screenName
 * @desc    Update an existing screen
 * @access  Private (Developer)
 */
router.put(
  '/:packageName/:screenName',
  validateDeveloper,
  validatePackageName,
  scanJsonContent,
  updateScreen
);

/**
 * @route   DELETE /api/screens/:packageName/:screenName
 * @desc    Delete a screen
 * @access  Private (Developer)
 */
router.delete(
  '/:packageName/:screenName',
  validateDeveloper,
  validatePackageName,
  deleteScreen
);

module.exports = router;
