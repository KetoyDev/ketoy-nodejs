const { Developer, App } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register a new developer
 * @route   POST /api/developers/register
 * @access  Public
 */
const registerDeveloper = asyncHandler(async (req, res) => {
  const { email, name, contactDetails } = req.body;

  // Check if developer already exists
  const existingDeveloper = await Developer.findOne({ email });
  if (existingDeveloper) {
    return res.status(400).json({
      success: false,
      error: 'Developer with this email already exists'
    });
  }

  // Create new developer
  const developer = await Developer.create({
    email,
    name,
    contactDetails
  });

  // Get developer with API key for response
  const developerWithApiKey = await Developer.findById(developer._id).select('+apiKey');

  res.status(201).json({
    success: true,
    message: 'Developer registered successfully',
    data: {
      developer: {
        id: developerWithApiKey._id,
        email: developerWithApiKey.email,
        name: developerWithApiKey.name,
        contactDetails: developerWithApiKey.contactDetails,
        createdAt: developerWithApiKey.createdAt
      },
      apiKey: developerWithApiKey.apiKey
    }
  });
});

/**
 * @desc    Get developer profile
 * @route   GET /api/developers/profile
 * @access  Private (Developer)
 */
const getDeveloperProfile = asyncHandler(async (req, res) => {
  const developer = req.developer;

  // Get developer's apps count
  const appsCount = await App.countDocuments({ developer: developer._id });

  res.status(200).json({
    success: true,
    data: {
      developer: {
        id: developer._id,
        email: developer.email,
        name: developer.name,
        contactDetails: developer.contactDetails,
        isActive: developer.isActive,
        appsCount,
        createdAt: developer.createdAt
      }
    }
  });
});

/**
 * @desc    Update developer profile
 * @route   PUT /api/developers/profile
 * @access  Private (Developer)
 */
const updateDeveloperProfile = asyncHandler(async (req, res) => {
  const { name, contactDetails } = req.body;
  const developer = req.developer;

  // Update fields
  if (name) developer.name = name;
  if (contactDetails) {
    developer.contactDetails = {
      ...developer.contactDetails,
      ...contactDetails
    };
  }

  await developer.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      developer: {
        id: developer._id,
        email: developer.email,
        name: developer.name,
        contactDetails: developer.contactDetails
      }
    }
  });
});

/**
 * @desc    Get all developers (Admin only)
 * @route   GET /api/developers
 * @access  Private (Admin)
 */
const getAllDevelopers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
  }

  const developers = await Developer.find(query)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Developer.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      developers,
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
 * @desc    Delete developer (Admin only)
 * @route   DELETE /api/developers/:id
 * @access  Private (Admin)
 */
const deleteDeveloper = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const developer = await Developer.findById(id);
  if (!developer) {
    return res.status(404).json({
      success: false,
      error: 'Developer not found'
    });
  }

  // Check if developer has apps
  const appsCount = await App.countDocuments({ developer: id });
  if (appsCount > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete developer with existing apps. Delete apps first.'
    });
  }

  await Developer.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Developer deleted successfully'
  });
});

/**
 * @desc    Regenerate developer API key
 * @route   POST /api/developers/regenerate-key
 * @access  Private (Developer)
 */
const regenerateDeveloperApiKey = asyncHandler(async (req, res) => {
  const developer = req.developer;

  // Generate new API key
  developer.apiKey = require('crypto').randomBytes(32).toString('hex');
  await developer.save();

  // Get updated developer with new API key
  const updatedDeveloper = await Developer.findById(developer._id).select('+apiKey');

  res.status(200).json({
    success: true,
    message: 'API key regenerated successfully',
    data: {
      apiKey: updatedDeveloper.apiKey
    }
  });
});

module.exports = {
  registerDeveloper,
  getDeveloperProfile,
  updateDeveloperProfile,
  getAllDevelopers,
  deleteDeveloper,
  regenerateDeveloperApiKey
};
