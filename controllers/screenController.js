const { Screen, App } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const r2Storage = require('../services/r2Storage');

/**
 * @desc    Upload/Create a new screen
 * @route   POST /api/screens/:packageName/upload
 * @access  Private (Developer)
 */
const uploadScreen = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const { screenName, displayName, description, jsonContent, version, metadata } = req.body;
  const developerId = req.developer._id;

  // Find app and verify ownership
  const app = await App.findOne({ packageName, developer: developerId });
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found or you do not have permission'
    });
  }

  // Check if screen already exists
  const existingScreen = await Screen.findOne({ packageName, screenName });
  if (existingScreen) {
    return res.status(400).json({
      success: false,
      error: 'Screen with this name already exists for this app'
    });
  }

  // Use validated JSON from security middleware
  const validatedJson = req.validatedJson || JSON.parse(jsonContent);
  const jsonSize = req.jsonSize;

  // Upload JSON to R2
  const { filePath, fileSize } = await r2Storage.uploadJsonFile(
    packageName,
    screenName,
    validatedJson,
    version || '1.0.0'
  );

  // Create screen record in database
  const screen = await Screen.create({
    app: app._id,
    packageName,
    screenName,
    displayName: displayName || screenName,
    description,
    jsonFilePath: filePath,
    version: version || '1.0.0',
    metadata: {
      fileSize,
      lastModified: new Date(),
      ...metadata
    }
  });

  res.status(201).json({
    success: true,
    message: 'Screen uploaded successfully',
    data: {
      screen: {
        id: screen._id,
        screenName: screen.screenName,
        displayName: screen.displayName,
        jsonFilePath: screen.jsonFilePath,
        version: screen.version,
        fileSize,
        createdAt: screen.createdAt
      }
    }
  });
});

/**
 * @desc    Update an existing screen
 * @route   PUT /api/screens/:packageName/:screenName
 * @access  Private (Developer)
 */
const updateScreen = asyncHandler(async (req, res) => {
  const { packageName, screenName } = req.params;
  const { displayName, description, jsonContent, version, metadata, isActive } = req.body;
  const developerId = req.developer._id;

  // Find app and verify ownership
  const app = await App.findOne({ packageName, developer: developerId });
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found or you do not have permission'
    });
  }

  // Find screen
  const screen = await Screen.findOne({ packageName, screenName, app: app._id });
  if (!screen) {
    return res.status(404).json({
      success: false,
      error: 'Screen not found'
    });
  }

  // Update JSON if provided
  if (jsonContent) {
    const validatedJson = req.validatedJson || JSON.parse(jsonContent);
    
    const { fileSize } = await r2Storage.updateJsonFile(
      screen.jsonFilePath,
      validatedJson,
      version || screen.version
    );

    screen.metadata.fileSize = fileSize;
    screen.metadata.lastModified = new Date();
  }

  // Update other fields
  if (displayName) screen.displayName = displayName;
  if (description !== undefined) screen.description = description;
  if (version) screen.version = version;
  if (isActive !== undefined) screen.isActive = isActive;
  if (metadata) {
    screen.metadata = {
      ...screen.metadata,
      ...metadata
    };
  }

  await screen.save();

  res.status(200).json({
    success: true,
    message: 'Screen updated successfully',
    data: { screen }
  });
});

/**
 * @desc    Get all screens for an app
 * @route   GET /api/screens/:packageName
 * @access  Private (Developer)
 */
const getAppScreens = asyncHandler(async (req, res) => {
  const { packageName } = req.params;
  const developerId = req.developer._id;
  const { page = 1, limit = 20, search, isActive } = req.query;

  // Find app and verify ownership
  const app = await App.findOne({ packageName, developer: developerId });
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found or you do not have permission'
    });
  }

  const query = { app: app._id };
  
  if (search) {
    query.$or = [
      { screenName: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const screens = await Screen.find(query)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Screen.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      screens,
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
 * @desc    Get screen details (for developer)
 * @route   GET /api/screens/:packageName/:screenName/details
 * @access  Private (Developer)
 */
const getScreenDetails = asyncHandler(async (req, res) => {
  const { packageName, screenName } = req.params;
  const developerId = req.developer._id;

  // Find app and verify ownership
  const app = await App.findOne({ packageName, developer: developerId });
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found or you do not have permission'
    });
  }

  const screen = await Screen.findOne({ packageName, screenName, app: app._id });
  if (!screen) {
    return res.status(404).json({
      success: false,
      error: 'Screen not found'
    });
  }

  // Optionally include JSON content
  const includeJson = req.query.includeJson === 'true';
  let jsonContent = null;

  if (includeJson) {
    jsonContent = await r2Storage.getJsonFile(screen.jsonFilePath);
  }

  res.status(200).json({
    success: true,
    data: {
      screen,
      ...(includeJson && { jsonContent })
    }
  });
});

/**
 * @desc    Delete a screen
 * @route   DELETE /api/screens/:packageName/:screenName
 * @access  Private (Developer)
 */
const deleteScreen = asyncHandler(async (req, res) => {
  const { packageName, screenName } = req.params;
  const developerId = req.developer._id;

  // Find app and verify ownership
  const app = await App.findOne({ packageName, developer: developerId });
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found or you do not have permission'
    });
  }

  const screen = await Screen.findOne({ packageName, screenName, app: app._id });
  if (!screen) {
    return res.status(404).json({
      success: false,
      error: 'Screen not found'
    });
  }

  // Delete JSON file from R2
  try {
    await r2Storage.deleteJsonFile(screen.jsonFilePath);
  } catch (error) {
    console.error('Failed to delete file from R2:', error);
  }

  // Delete screen record
  await Screen.findByIdAndDelete(screen._id);

  res.status(200).json({
    success: true,
    message: 'Screen deleted successfully'
  });
});

/**
 * @desc    Get screen JSON (For Mobile Apps - Main API Endpoint)
 * @route   GET /api/v1/screen
 * @access  Public (with API Key)
 */
const getScreenJson = asyncHandler(async (req, res) => {
  const { screen_name } = req.query;
  const packageName = req.packageName; // Set by validateApiKey middleware
  const app = req.appData; // Set by validateApiKey middleware (changed from req.app)

  if (!screen_name) {
    return res.status(400).json({
      success: false,
      error: 'screen_name query parameter is required'
    });
  }

  // Find screen
  const screen = await Screen.findByPackageAndScreen(packageName, screen_name);

  if (!screen) {
    return res.status(404).json({
      success: false,
      error: 'Screen not found'
    });
  }

  // Check if screen is active
  if (!screen.isActive) {
    return res.status(403).json({
      success: false,
      error: 'This screen is currently inactive'
    });
  }

  // Check if app is active
  if (!screen.app.isActive) {
    return res.status(403).json({
      success: false,
      error: 'This app is currently inactive'
    });
  }

  // Retrieve JSON from R2
  const jsonContent = await r2Storage.getJsonFile(screen.jsonFilePath);

  // Track access
  await screen.trackAccess();

  // Return JSON directly as response
  res.status(200).json({
    success: true,
    data: {
      screenName: screen.screenName,
      version: screen.version,
      ui: jsonContent // The actual UI definition
    }
  });
});

/**
 * @desc    Get screen version only (for mobile apps to check updates)
 * @route   GET /api/v1/screen/version?screen_name=xxx
 * @access  Public (with API Key)
 */
const getScreenVersion = asyncHandler(async (req, res) => {
  const { screen_name } = req.query;
  const packageName = req.packageName; // Set by validateApiKey middleware

  if (!screen_name) {
    return res.status(400).json({
      success: false,
      error: 'screen_name query parameter is required'
    });
  }

  // Find screen
  const screen = await Screen.findByPackageAndScreen(packageName, screen_name);

  if (!screen) {
    return res.status(404).json({
      success: false,
      error: 'Screen not found'
    });
  }

  // Check if screen is active
  if (!screen.isActive) {
    return res.status(403).json({
      success: false,
      error: 'This screen is currently inactive'
    });
  }

  // Check if app is active
  if (!screen.app.isActive) {
    return res.status(403).json({
      success: false,
      error: 'This app is currently inactive'
    });
  }

  // Return only version info (no R2 fetch needed)
  res.status(200).json({
    success: true,
    data: {
      screenName: screen.screenName,
      version: screen.version,
      updatedAt: screen.updatedAt
    }
  });
});

module.exports = {
  uploadScreen,
  updateScreen,
  getAppScreens,
  getScreenDetails,
  deleteScreen,
  getScreenJson,
  getScreenVersion
};
