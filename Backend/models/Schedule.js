const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Schedule must belong to a project']
  },
  title: {
    type: String,
    required: [true, 'Schedule title is required'],
    trim: true,
    maxlength: [200, 'Schedule title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Schedule description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['shooting', 'pre-production', 'post-production', 'meeting', 'other'],
    default: 'shooting'
  },
  date: {
    type: Date,
    required: [true, 'Schedule date is required']
  },
  timeSlot: {
    startTime: {
      type: String, // Format: "HH:MM"
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
    },
    duration: Number // calculated duration in minutes
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    notes: String
  },
  scenes: [{
    scene: {
      type: mongoose.Schema.ObjectId,
      ref: 'Scene'
    },
    estimatedDuration: Number, // in minutes
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'postponed', 'cancelled'],
      default: 'not-started'
    },
    notes: String,
    actualStartTime: String,
    actualEndTime: String
  }],
  crew: [{
    member: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      required: true
    },
    callTime: String, // Format: "HH:MM"
    wrapTime: String, // Format: "HH:MM"
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'declined', 'absent'],
      default: 'pending'
    },
    notes: String
  }],
  cast: [{
    name: String,
    character: String,
    contact: String,
    callTime: String, // Format: "HH:MM"
    wrapTime: String, // Format: "HH:MM"
    costume: String,
    makeup: String,
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'declined', 'absent'],
      default: 'pending'
    },
    notes: String
  }],
  equipment: [{
    name: String,
    category: {
      type: String,
      enum: ['camera', 'lens', 'lighting', 'audio', 'grip', 'other'],
      default: 'other'
    },
    quantity: {
      type: Number,
      default: 1
    },
    supplier: String,
    pickupTime: String, // Format: "HH:MM"
    returnTime: String, // Format: "HH:MM"
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'picked-up', 'returned', 'cancelled'],
      default: 'reserved'
    },
    notes: String
  }],
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    notes: String
  },
  budget: {
    estimated: {
      type: Number,
      default: 0
    },
    actual: Number,
    breakdown: [{
      item: String,
      category: String,
      amount: Number,
      notes: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in-progress', 'completed', 'cancelled', 'postponed'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  notes: String,
  contingencyPlan: String,
  emergencyContacts: [{
    name: String,
    role: String,
    phone: String,
    email: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
scheduleSchema.index({ project: 1, date: 1 });
scheduleSchema.index({ project: 1, status: 1 });
scheduleSchema.index({ date: 1, status: 1 });
scheduleSchema.index({ 'crew.member': 1 });

// Virtual for total estimated duration
scheduleSchema.virtual('totalEstimatedDuration').get(function() {
  return this.scenes.reduce((total, scene) => total + (scene.estimatedDuration || 0), 0);
});

// Virtual for crew count
scheduleSchema.virtual('crewCount').get(function() {
  return this.crew.length;
});

// Virtual for cast count
scheduleSchema.virtual('castCount').get(function() {
  return this.cast.length;
});

// Pre-save middleware to calculate duration
scheduleSchema.pre('save', async function() {
  if (this.timeSlot && this.timeSlot.startTime && this.timeSlot.endTime) {
    const start = this.timeSlot.startTime.split(':');
    const end = this.timeSlot.endTime.split(':');
    
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    
    this.timeSlot.duration = endMinutes - startMinutes;
  }
});

// Static method to find conflicts
scheduleSchema.statics.findConflicts = function(projectId, date, startTime, endTime, excludeId = null) {
  const query = {
    project: projectId,
    date: date,
    $or: [
      { 'timeSlot.startTime': { $lte: startTime }, 'timeSlot.endTime': { $gte: startTime } },
      { 'timeSlot.startTime': { $lte: endTime }, 'timeSlot.endTime': { $gte: endTime } },
      { 'timeSlot.startTime': { $gte: startTime }, 'timeSlot.endTime': { $lte: endTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Instance method to check if crew member is available
scheduleSchema.methods.isCrewAvailable = function(crewMemberId, date, startTime, endTime) {
  // This would typically check against other schedules
  // For now, just check if they're already assigned to this schedule
  return !this.crew.some(member => 
    member.member.toString() === crewMemberId.toString()
  );
};

module.exports = mongoose.model('Schedule', scheduleSchema);