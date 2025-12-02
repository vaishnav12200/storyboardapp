const mongoose = require('mongoose');

const shotSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Shot must belong to a project']
  },
  scene: {
    type: mongoose.Schema.ObjectId,
    ref: 'Scene'
  },
  shotNumber: {
    type: String,
    required: [true, 'Shot number is required'],
    trim: true
  },
  shotName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Shot description cannot be more than 1000 characters']
  },
  shotType: {
    type: String,
    enum: ['wide', 'medium', 'close-up', 'extreme-close-up', 'over-shoulder', 'pov', 'establishing', 'insert', 'cutaway', 'master'],
    default: 'medium'
  },
  cameraMovement: {
    type: String,
    enum: ['static', 'pan', 'tilt', 'zoom', 'dolly', 'crane', 'handheld', 'steadicam', 'track'],
    default: 'static'
  },
  angle: {
    type: String,
    enum: ['eye-level', 'high', 'low', 'dutch', 'overhead', 'worm-eye', 'high-angle', 'low-angle', 'bird-eye'],
    default: 'eye-level'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  fps: {
    type: Number,
    default: 24
  },
  equipment: [{
    type: String
  }],
  crew: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['planned', 'ready', 'in-progress', 'completed', 'cancelled'],
    default: 'planned'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  notes: {
    type: String
  },
  storyboardPanel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Scene.storyboard.panels' // Reference to a storyboard panel
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
shotSchema.index({ project: 1 });
shotSchema.index({ scene: 1 });
shotSchema.index({ project: 1, shotNumber: 1 });
shotSchema.index({ status: 1 });

// Static method to get next shot number for a project
shotSchema.statics.getNextShotNumber = async function(projectId) {
  const lastShot = await this.findOne({ project: projectId })
    .sort({ createdAt: -1 });
  
  if (!lastShot || !lastShot.shotNumber) {
    return '001';
  }
  
  // Extract numeric part and increment
  const match = lastShot.shotNumber.match(/\d+/);
  if (match) {
    const num = parseInt(match[0]) + 1;
    return num.toString().padStart(3, '0');
  }
  
  return '001';
};

// Instance method to duplicate shot
shotSchema.methods.duplicate = function() {
  const duplicatedShot = this.toObject();
  delete duplicatedShot._id;
  delete duplicatedShot.createdAt;
  delete duplicatedShot.updatedAt;
  duplicatedShot.shotName += ' (Copy)';
  duplicatedShot.status = 'planned';
  
  return new this.constructor(duplicatedShot);
};

module.exports = mongoose.model('Shot', shotSchema);
