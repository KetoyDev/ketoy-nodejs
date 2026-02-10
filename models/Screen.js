const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'App reference is required']
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true
  },
  screenName: {
    type: String,
    required: [true, 'Screen name is required'],
    trim: true,
    match: [/^[a-zA-Z0-9_-]+$/, 'Screen name can only contain letters, numbers, hyphens, and underscores']
  },
  displayName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  jsonFilePath: {
    type: String,
    required: [true, 'JSON file path is required']
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    fileSize: {
      type: Number // Size in bytes
    },
    lastModified: {
      type: Date
    },
    category: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate screen names per app
screenSchema.index({ packageName: 1, screenName: 1 }, { unique: true });
screenSchema.index({ app: 1 });
screenSchema.index({ isActive: 1 });

// Update access tracking
screenSchema.methods.trackAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Methods
screenSchema.methods.toJSON = function() {
  const screen = this.toObject();
  delete screen.__v;
  return screen;
};

// Static method to find screen by package and screen name
screenSchema.statics.findByPackageAndScreen = async function(packageName, screenName) {
  return this.findOne({ 
    packageName, 
    screenName, 
    isActive: true 
  }).populate('app', 'packageName appName isActive');
};

module.exports = mongoose.model('Screen', screenSchema);
