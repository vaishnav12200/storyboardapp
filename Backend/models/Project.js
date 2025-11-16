const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  type: {
    type: String,
    enum: ['movie', 'short-film', 'commercial', 'music-video', 'documentary', 'tv-series', 'other'],
    required: [true, 'Project type is required'],
    default: 'short-film'
  },
  genre: {
    type: String,
    enum: ['action', 'comedy', 'drama', 'horror', 'romance', 'thriller', 'sci-fi', 'fantasy', 'documentary', 'other']
  },
  status: {
    type: String,
    enum: ['planning', 'pre-production', 'production', 'post-production', 'completed', 'cancelled'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Project must have an owner']
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['director', 'producer', 'writer', 'cinematographer', 'editor', 'actor', 'crew'],
      default: 'crew'
    },
    permissions: {
      type: [String],
      enum: ['read', 'write', 'delete', 'admin'],
      default: ['read']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  budget: {
    total: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    }
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    estimatedDuration: Number // in days
  },
  location: {
    primary: String,
    additional: [String]
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    totalScenes: {
      type: Number,
      default: 0
    },
    totalShots: {
      type: Number,
      default: 0
    },
    estimatedRuntime: Number, // in minutes
    aspectRatio: {
      type: String,
      default: '16:9'
    },
    resolution: {
      type: String,
      default: '1920x1080'
    }
  },
  tags: [String],
  coverImage: String,
  files: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'collaborators.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ isArchived: 1 });
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual populate for scenes
projectSchema.virtual('scenes', {
  ref: 'Scene',
  localField: '_id',
  foreignField: 'project'
});

// Virtual populate for schedules
projectSchema.virtual('schedules', {
  ref: 'Schedule',
  localField: '_id',
  foreignField: 'project'
});

// Virtual populate for budgets
projectSchema.virtual('budgets', {
  ref: 'Budget',
  localField: '_id',
  foreignField: 'project'
});

// Pre-save middleware to update lastModified
projectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModified = new Date();
  }
  next();
});

// Instance method to check if user has permission
projectSchema.methods.hasPermission = function(userId, permission) {
  // Owner has all permissions
  if (this.owner.toString() === userId.toString()) {
    return true;
  }

  // Check collaborator permissions
  const collaborator = this.collaborators.find(
    collab => collab.user.toString() === userId.toString()
  );

  if (!collaborator) return false;

  return collaborator.permissions.includes(permission) || 
         collaborator.permissions.includes('admin');
};

// Static method to find projects user has access to
projectSchema.statics.findUserProjects = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'collaborators.user': userId }
    ],
    isArchived: false
  }).populate('owner', 'firstName lastName email profileImage')
    .populate('collaborators.user', 'firstName lastName email profileImage')
    .sort({ lastModified: -1 });
};

module.exports = mongoose.model('Project', projectSchema);