const { App } = require('../models');

/**
 * Middleware to validate API Key and Package Name
 * Used by mobile apps to access screen JSON
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const packageName = req.headers['x-package-name'] || req.body.package_name || req.query.package_name;

    // Check if both API key and package name are provided
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required. Provide it in x-api-key header or api_key query parameter'
      });
    }

    if (!packageName) {
      return res.status(401).json({
        success: false,
        error: 'Package name is required. Provide it in x-package-name header or package_name parameter'
      });
    }

    // Verify API key and package name
    const app = await App.verifyApiKey(packageName, apiKey);

    if (!app) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key or package name'
      });
    }

    // Check if app is active
    if (!app.isActive) {
      return res.status(403).json({
        success: false,
        error: 'This app is currently inactive'
      });
    }

    // Attach app to request for use in controllers
    req.appData = app; // Changed from req.app to avoid Express reserved property
    req.packageName = packageName;

    next();
  } catch (error) {
    console.error('API Key validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to validate developer authentication
 * Used by developers to manage their apps and screens
 */
const validateDeveloper = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-developer-api-key'] || req.query.developer_api_key;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Developer API key is required. Provide it in x-developer-api-key header'
      });
    }

    // Verify developer API key
    const { Developer } = require('../models');
    const developer = await Developer.verifyApiKey(apiKey);

    if (!developer) {
      return res.status(401).json({
        success: false,
        error: 'Invalid developer API key'
      });
    }

    if (!developer.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Developer account is inactive'
      });
    }

    req.developer = developer;
    next();
  } catch (error) {
    console.error('Developer validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if developer owns the app
 */
const validateAppOwnership = async (req, res, next) => {
  try {
    const { packageName } = req.params;
    const developerId = req.developer._id;

    const app = await App.findOne({ packageName, developer: developerId });

    if (!app) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this app'
      });
    }

    req.appOwned = app;
    next();
  } catch (error) {
    console.error('App ownership validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization failed'
    });
  }
};

module.exports = {
  validateApiKey,
  validateDeveloper,
  validateAppOwnership
};
