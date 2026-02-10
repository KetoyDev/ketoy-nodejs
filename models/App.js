const mongoose = require('mongoose');
const crypto = require('crypto');

const appSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    unique: true,
    trim: true,
    match: [/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Please provide a valid package name (e.g., com.example.app)']
  },
  appName: {
    type: String,
    required: [true, 'App name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Developer',
    required: [true, 'Developer reference is required']
  },
  apiKey: {
    type: String,
    unique: true,
    select: false // Don't include in queries by default
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'both'],
      default: 'both'
    }
  },
  r2FolderPath: {
    type: String
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

// Indexes
appSchema.index({ packageName: 1 });
appSchema.index({ developer: 1 });
appSchema.index({ apiKey: 1 });

// Generate API Key before saving
appSchema.pre('save', function(next) {
  if (this.isNew) {
    this.apiKey = crypto.randomBytes(32).toString('hex');
    this.r2FolderPath = `apps/${this.packageName}`;
  }
  next();
});

// Methods
appSchema.methods.toJSON = function() {
  const app = this.toObject();
  delete app.__v;
  // Only include apiKey if explicitly selected
  if (!app.apiKey) {
    delete app.apiKey;
  }
  return app;
};

// Static method to verify API key
appSchema.statics.verifyApiKey = async function(packageName, apiKey) {
  const app = await this.findOne({ packageName, isActive: true }).select('+apiKey');
  if (!app) {
    return null;
  }
  return app.apiKey === apiKey ? app : null;
};

module.exports = mongoose.model('App', appSchema);
