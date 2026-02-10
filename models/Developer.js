const mongoose = require('mongoose');
const crypto = require('crypto');

const developerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  contactDetails: {
    phone: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  apiKey: {
    type: String,
    unique: true,
    select: false // Hidden by default for security
  },
  isActive: {
    type: Boolean,
    default: true
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
developerSchema.index({ email: 1 });
developerSchema.index({ apiKey: 1 });

// Pre-save hook to generate API key
developerSchema.pre('save', async function(next) {
  // Generate API key only if it's a new developer or apiKey is not set
  if (this.isNew || !this.apiKey) {
    this.apiKey = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Static method to verify API key
developerSchema.statics.verifyApiKey = async function(apiKey) {
  if (!apiKey) return null;
  
  const developer = await this.findOne({ apiKey, isActive: true });
  return developer;
};

// Methods
developerSchema.methods.toJSON = function() {
  const developer = this.toObject();
  delete developer.__v;
  return developer;
};

module.exports = mongoose.model('Developer', developerSchema);
