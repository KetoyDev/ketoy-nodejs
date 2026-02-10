const express = require('express');
const router = express.Router();

const developerRoutes = require('./developerRoutes');
const appRoutes = require('./appRoutes');
const screenRoutes = require('./screenRoutes');

/**
 * Root API endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server-Driven UI (SDUI) Backend API',
    version: '1.0.0',
    endpoints: {
      developers: '/api/developers',
      apps: '/api/apps',
      screens: '/api/screens',
      mobileApi: '/api/v1/screen'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/developers', developerRoutes);
router.use('/apps', appRoutes);
router.use('/screens', screenRoutes);

// Mobile API route (public with API key)
const { validateApiKey, validateScreenRetrieval } = require('../middleware');
const { getScreenJson } = require('../controllers/screenController');

/**
 * @route   GET /api/v1/screen
 * @desc    Get screen JSON for mobile app (Main API endpoint)
 * @access  Public (with API Key)
 * @query   screen_name
 * @headers x-api-key, x-package-name
 */
router.get('/v1/screen', validateApiKey, validateScreenRetrieval, getScreenJson);

module.exports = router;
