const { App, Screen } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const r2Storage = require('../services/r2Storage');

/**
 * @desc    Register a new app
 * @route   POST /api/apps/register
 * @access  Private (Developer)
 */
const registerApp = asyncHandler(async (req, res) => {
  const { packageName, appName, description, metadata } = req.body;
  const developerId = req.developer._id;

  // Check if app already exists
  const existingApp = await App.findOne({ packageName });
  if (existingApp) {
    return res.status(400).json({
      success: false,
      error: 'App with this package name already exists'
    });
  }

  // Create new app
  const app = await App.create({
    packageName,
    appName,
    description,
    developer: developerId,
    metadata: metadata || {}
  });

  // Get app with API key included
  const appWithKey = await App.findById(app._id).select('+apiKey');

  res.status(201).json({
    success: true,
    message: 'App registered successfully',
    data: {
      app: {
        id: app._id,
        packageName: app.packageName,
        appName: app.appName,
        description: app.description,
        apiKey: appWithKey.apiKey,
        r2FolderPath: app.r2FolderPath,
        metadata: app.metadata,
        createdAt: app.createdAt
      }
    },
    important: 'Please save the API key securely. It will not be shown again.'
  });
});

/**
 * @desc    Get all apps for a developer
 * @route   GET /api/apps
 * @access  Private (Developer)
 */
const getDeveloperApps = asyncHandler(async (req, res) => {
  const developerId = req.developer._id;
  const { page = 1, limit = 10, search } = req.query;

  const query = { developer: developerId };
  if (search) {
    query.$or = [
      { packageName: { $regex: search, $options: 'i' } },
      { appName: { $regex: search, $options: 'i' } }
    ];
  }

  const apps = await App.find(query)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await App.countDocuments(query);

  // Get screen count for each app
  const appsWithScreenCount = await Promise.all(
    apps.map(async (app) => {
      const screenCount = await Screen.countDocuments({ app: app._id });
      return {
        ...app.toJSON(),
        screenCount
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      apps: appsWithScreenCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get single app details
 * @route   GET /api/apps/:packageName
 * @access  Private (Developer)
 */
const getAppDetails = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const developerId = req.developer._id;

  const app = await App.findOne({ packageName, developer: developerId });

  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found'
    });
  }

  // Get screen count and list
  const screenCount = await Screen.countDocuments({ app: app._id });
  const screens = await Screen.find({ app: app._id })
    .select('screenName displayName version isActive accessCount lastAccessed')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      app: {
        ...app.toJSON(),
        screenCount,
        screens
      }
    }
  });
});

/**
 * @desc    Update app details
 * @route   PUT /api/apps/:packageName
 * @access  Private (Developer)
 */
const updateApp = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const { appName, description, metadata, isActive } = req.body;
  const developerId = req.developer._id;

  const app = await App.findOne({ packageName, developer: developerId });

  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found'
    });
  }

  // Update fields
  if (appName) app.appName = appName;
  if (description !== undefined) app.description = description;
  if (metadata) app.metadata = { ...app.metadata, ...metadata };
  if (isActive !== undefined) app.isActive = isActive;

  await app.save();

  res.status(200).json({
    success: true,
    message: 'App updated successfully',
    data: { app }
  });
});

/**
 * @desc    Regenerate API key for an app
 * @route   POST /api/apps/:packageName/regenerate-key
 * @access  Private (Developer)
 */
const regenerateApiKey = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const developerId = req.developer._id;

  const app = await App.findOne({ packageName, developer: developerId }).select('+apiKey');

  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found'
    });
  }

  // Generate new API key
  const crypto = require('crypto');
  app.apiKey = crypto.randomBytes(32).toString('hex');
  await app.save();

  res.status(200).json({
    success: true,
    message: 'API key regenerated successfully',
    data: {
      apiKey: app.apiKey
    },
    important: 'Please save the new API key securely. The old key is now invalid.'
  });
});

/**
 * @desc    Delete an app
 * @route   DELETE /api/apps/:packageName
 * @access  Private (Developer)
 */
const deleteApp = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const developerId = req.developer._id;

  const app = await App.findOne({ packageName, developer: developerId });

  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found'
    });
  }

  // Delete all screens associated with this app
  const screens = await Screen.find({ app: app._id });
  
  // Delete all JSON files from R2
  for (const screen of screens) {
    try {
      await r2Storage.deleteJsonFile(screen.jsonFilePath);
    } catch (error) {
      console.error(`Failed to delete file ${screen.jsonFilePath}:`, error);
    }
  }

  // Delete all screen records
  await Screen.deleteMany({ app: app._id });

  // Delete app
  await App.findByIdAndDelete(app._id);

  res.status(200).json({
    success: true,
    message: 'App and all associated screens deleted successfully'
  });
});

/**
 * @desc    Get app statistics
 * @route   GET /api/apps/:packageName/stats
 * @access  Private (Developer)
 */
const getAppStats = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const developerId = req.developer._id;

  const app = await App.findOne({ packageName, developer: developerId });

  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found'
    });
  }

  const screens = await Screen.find({ app: app._id });
  const totalScreens = screens.length;
  const activeScreens = screens.filter(s => s.isActive).length;
  const totalAccesses = screens.reduce((sum, s) => sum + s.accessCount, 0);
  
  // Get most accessed screen
  const mostAccessedScreen = screens.sort((a, b) => b.accessCount - a.accessCount)[0];

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalScreens,
        activeScreens,
        inactiveScreens: totalScreens - activeScreens,
        totalAccesses,
        mostAccessedScreen: mostAccessedScreen ? {
          screenName: mostAccessedScreen.screenName,
          accessCount: mostAccessedScreen.accessCount
        } : null
      }
    }
  });
});

module.exports = {
  registerApp,
  getDeveloperApps,
  getAppDetails,
  updateApp,
  regenerateApiKey,
  deleteApp,
  getAppStats
};
