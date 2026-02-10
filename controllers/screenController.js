const { Screen, App } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const r2Storage = require('../services/r2Storage');

/**
 * @desc    Upload/Create a new screen (or new version of existing screen)
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

  const newVersion = version || '1.0.0';

  // Use validated JSON from security middleware
  const validatedJson = req.validatedJson || JSON.parse(jsonContent);

  // Check if screen already exists
  const existingScreen = await Screen.findOne({ packageName, screenName });

  if (existingScreen) {
    // Screen exists — validate version is newer
    const cmp = Screen.compareVersions(newVersion, existingScreen.version);
    if (cmp <= 0) {
      return res.status(400).json({
        success: false,
        error: `Version must be higher than current version (${existingScreen.version}). Provided: ${newVersion}`,
        currentVersion: existingScreen.version
      });
    }

    // Archive current version's file to versioned path in R2
    await r2Storage.archiveCurrentVersion(
      packageName,
      screenName,
      existingScreen.jsonFilePath,
      existingScreen.version
    );

    // Archive current version into versionHistory
    existingScreen.versionHistory.push({
      version: existingScreen.version,
      jsonFilePath: `apps/${packageName}/${screenName}/v${existingScreen.version}.json`,
      fileSize: existingScreen.metadata.fileSize,
      createdAt: existingScreen.updatedAt
    });

    // Upload new version to R2 (stores both latest + versioned copy)
    const { filePath, versionedFilePath, fileSize } = await r2Storage.uploadJsonFile(
      packageName,
      screenName,
      validatedJson,
      newVersion
    );

    // Update screen record
    existingScreen.jsonFilePath = filePath;
    existingScreen.version = newVersion;
    existingScreen.metadata.fileSize = fileSize;
    existingScreen.metadata.lastModified = new Date();
    if (displayName) existingScreen.displayName = displayName;
    if (description !== undefined) existingScreen.description = description;
    if (metadata) {
      existingScreen.metadata = { ...existingScreen.metadata.toObject(), ...metadata, fileSize, lastModified: new Date() };
    }

    await existingScreen.save();

    return res.status(200).json({
      success: true,
      message: `Screen updated to version ${newVersion}`,
      data: {
        screen: {
          id: existingScreen._id,
          screenName: existingScreen.screenName,
          displayName: existingScreen.displayName,
          jsonFilePath: existingScreen.jsonFilePath,
          version: existingScreen.version,
          previousVersion: existingScreen.versionHistory[existingScreen.versionHistory.length - 1].version,
          totalVersions: existingScreen.versionHistory.length + 1,
          fileSize,
          updatedAt: existingScreen.updatedAt
        }
      }
    });
  }

  // New screen — first upload
  const { filePath, fileSize } = await r2Storage.uploadJsonFile(
    packageName,
    screenName,
    validatedJson,
    newVersion
  );

  // Create screen record in database
  const screen = await Screen.create({
    app: app._id,
    packageName,
    screenName,
    displayName: displayName || screenName,
    description,
    jsonFilePath: filePath,
    version: newVersion,
    versionHistory: [],
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
        totalVersions: 1,
        fileSize,
        createdAt: screen.createdAt
      }
    }
  });
});

/**
 * @desc    Update an existing screen (metadata only, or use upload for new version)
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

  // If JSON content + version are provided, handle as version update
  if (jsonContent && version) {
    const cmp = Screen.compareVersions(version, screen.version);
    if (cmp <= 0) {
      return res.status(400).json({
        success: false,
        error: `Version must be higher than current version (${screen.version}). Provided: ${version}`,
        currentVersion: screen.version
      });
    }

    const validatedJson = req.validatedJson || JSON.parse(jsonContent);

    // Archive current version's file to versioned path in R2
    await r2Storage.archiveCurrentVersion(
      packageName,
      screenName,
      screen.jsonFilePath,
      screen.version
    );

    // Archive current version
    screen.versionHistory.push({
      version: screen.version,
      jsonFilePath: `apps/${packageName}/${screenName}/v${screen.version}.json`,
      fileSize: screen.metadata.fileSize,
      createdAt: screen.updatedAt
    });

    // Upload new version to R2
    const { filePath, fileSize } = await r2Storage.updateJsonFile(
      packageName,
      screenName,
      validatedJson,
      version
    );

    screen.jsonFilePath = filePath;
    screen.version = version;
    screen.metadata.fileSize = fileSize;
    screen.metadata.lastModified = new Date();
  }

  // Update other fields
  if (displayName) screen.displayName = displayName;
  if (description !== undefined) screen.description = description;
  if (isActive !== undefined) screen.isActive = isActive;
  if (metadata) {
    const currentMeta = screen.metadata.toObject ? screen.metadata.toObject() : screen.metadata;
    screen.metadata = {
      ...currentMeta,
      ...metadata
    };
  }

  await screen.save();

  res.status(200).json({
    success: true,
    message: 'Screen updated successfully',
    data: { 
      screen,
      totalVersions: screen.versionHistory.length + 1
    }
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

  // Delete all screen files from R2 (latest + all versions)
  let deletedFiles = 0;
  try {
    deletedFiles = await r2Storage.deleteAllScreenFiles(packageName, screenName);
  } catch (error) {
    console.error('Failed to delete files from R2:', error);
  }

  // Delete screen record
  await Screen.findByIdAndDelete(screen._id);

  res.status(200).json({
    success: true,
    message: 'Screen deleted successfully',
    data: {
      deletedFiles
    }
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

/**
 * @desc    Get all versions of a screen (for developer)
 * @route   GET /api/screens/:packageName/:screenName/versions
 * @access  Private (Developer)
 */
const getScreenVersions = asyncHandler(async (req, res) => {
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

  // Build versions list: current + history
  const versions = [
    {
      version: screen.version,
      isCurrent: true,
      fileSize: screen.metadata.fileSize,
      createdAt: screen.updatedAt
    },
    ...screen.versionHistory.map(v => ({
      version: v.version,
      isCurrent: false,
      fileSize: v.fileSize,
      createdAt: v.createdAt
    }))
  ].sort((a, b) => Screen.compareVersions(b.version, a.version));

  res.status(200).json({
    success: true,
    data: {
      screenName: screen.screenName,
      currentVersion: screen.version,
      totalVersions: versions.length,
      versions
    }
  });
});

/**
 * @desc    Get a specific version's JSON (for developer)
 * @route   GET /api/screens/:packageName/:screenName/versions/:version
 * @access  Private (Developer)
 */
const getScreenByVersion = asyncHandler(async (req, res) => {
  const { packageName, screenName, version: requestedVersion } = req.params;
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

  // Check if requested version exists
  const isCurrent = screen.version === requestedVersion;
  const inHistory = screen.versionHistory.find(v => v.version === requestedVersion);

  if (!isCurrent && !inHistory) {
    return res.status(404).json({
      success: false,
      error: `Version ${requestedVersion} not found. Current version: ${screen.version}`,
      availableVersions: [screen.version, ...screen.versionHistory.map(v => v.version)]
    });
  }

  // Fetch JSON from R2
  let jsonContent;
  try {
    jsonContent = await r2Storage.getVersionedJsonFile(packageName, screenName, requestedVersion);
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: `Version ${requestedVersion} file not found in storage`
    });
  }

  res.status(200).json({
    success: true,
    data: {
      screenName: screen.screenName,
      version: requestedVersion,
      isCurrent,
      ui: jsonContent
    }
  });
});

/**
 * @desc    Rollback to a previous version
 * @route   POST /api/screens/:packageName/:screenName/rollback/:version
 * @access  Private (Developer)
 */
const rollbackScreenVersion = asyncHandler(async (req, res) => {
  const { packageName, screenName, version: targetVersion } = req.params;
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

  // Can't rollback to current version
  if (screen.version === targetVersion) {
    return res.status(400).json({
      success: false,
      error: 'This is already the current version'
    });
  }

  // Check if target version exists in history
  const historyEntry = screen.versionHistory.find(v => v.version === targetVersion);
  if (!historyEntry) {
    return res.status(404).json({
      success: false,
      error: `Version ${targetVersion} not found in history`,
      availableVersions: screen.versionHistory.map(v => v.version)
    });
  }

  // Fetch the old version's JSON from R2
  let jsonContent;
  try {
    jsonContent = await r2Storage.getVersionedJsonFile(packageName, screenName, targetVersion);
  } catch (error) {
    return res.status(404).json({
      success: false,
      error: `Version ${targetVersion} file not found in storage. Cannot rollback.`
    });
  }

  // Archive current version's file to versioned path in R2
  await r2Storage.archiveCurrentVersion(
    packageName,
    screenName,
    screen.jsonFilePath,
    screen.version
  );

  // Archive current version
  screen.versionHistory.push({
    version: screen.version,
    jsonFilePath: `apps/${packageName}/${screenName}/v${screen.version}.json`,
    fileSize: screen.metadata.fileSize,
    createdAt: screen.updatedAt
  });

  // Generate new rollback version (bump patch from current)
  const currentParts = screen.version.split('.').map(Number);
  currentParts[2] += 1;
  const rollbackVersion = currentParts.join('.');

  // Upload as new version
  const { filePath, fileSize } = await r2Storage.uploadJsonFile(
    packageName,
    screenName,
    jsonContent,
    rollbackVersion
  );

  // Update screen record
  screen.jsonFilePath = filePath;
  screen.version = rollbackVersion;
  screen.metadata.fileSize = fileSize;
  screen.metadata.lastModified = new Date();
  await screen.save();

  res.status(200).json({
    success: true,
    message: `Screen rolled back from ${screen.versionHistory[screen.versionHistory.length - 1].version} to content of ${targetVersion} (new version: ${rollbackVersion})`,
    data: {
      screenName: screen.screenName,
      version: screen.version,
      rolledBackFrom: screen.versionHistory[screen.versionHistory.length - 1].version,
      restoredContent: targetVersion,
      totalVersions: screen.versionHistory.length + 1
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
  getScreenVersion,
  getScreenVersions,
  getScreenByVersion,
  rollbackScreenVersion
};
