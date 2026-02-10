const express = require('express');
const router = express.Router();
const {
  registerDeveloper,
  getDeveloperProfile,
  updateDeveloperProfile,
  getAllDevelopers,
  deleteDeveloper,
  regenerateDeveloperApiKey
} = require('../controllers/developerController');
const {
  validateDeveloperRegistration,
  validateDeveloper
} = require('../middleware');

/**
 * @route   POST /api/developers/register
 * @desc    Register a new developer
 * @access  Public
 */
router.post('/register', validateDeveloperRegistration, registerDeveloper);

/**
 * @route   GET /api/developers/profile
 * @desc    Get developer profile
 * @access  Private
 */
router.get('/profile', validateDeveloper, getDeveloperProfile);

/**
 * @route   PUT /api/developers/profile
 * @desc    Update developer profile
 * @access  Private
 */
router.put('/profile', validateDeveloper, updateDeveloperProfile);

/**
 * @route   POST /api/developers/regenerate-key
 * @desc    Regenerate developer API key
 * @access  Private
 */
router.post('/regenerate-key', validateDeveloper, regenerateDeveloperApiKey);

/**
 * @route   GET /api/developers
 * @desc    Get all developers (Admin)
 * @access  Private (Admin)
 */
router.get('/', getAllDevelopers);

/**
 * @route   DELETE /api/developers/:id
 * @desc    Delete developer (Admin)
 * @access  Private (Admin)
 */
router.delete('/:id', deleteDeveloper);

module.exports = router;
