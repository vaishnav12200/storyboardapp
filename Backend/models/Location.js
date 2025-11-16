const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Location must belong to a project']
  },
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [200, 'Location name cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['studio', 'outdoor', 'indoor', 'public', 'private', 'green-screen', 'practical'],
    required: [true, 'Location type is required'],
    default: 'outdoor'
  },
  category: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'natural', 'institutional', 'transportation', 'other'],
    default: 'other'
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    fullAddress: String
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  contact: {
    ownerName: String,
    phone: String,
    email: String,
    alternateContact: String,
    notes: String
  },
  availability: {
    timeRestrictions: {
      startTime: String, // "HH:MM" format
      endTime: String,   // "HH:MM" format
      restrictedDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    seasonalRestrictions: String,
    bookingRequired: {
      type: Boolean,
      default: false
    },
    advanceNotice: Number, // days required for booking
    blackoutDates: [Date]
  },
  logistics: {
    parkingAvailable: {
      type: Boolean,
      default: false
    },
    parkingCapacity: Number,
    powerAccess: {
      type: Boolean,
      default: false
    },
    powerType: String, // "110V", "220V", "Generator Required", etc.
    restroomAccess: {
      type: Boolean,
      default: false
    },
    cateringArea: {
      type: Boolean,
      default: false
    },
    equipmentAccess: {
      difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'difficult'],
        default: 'easy'
      },
      notes: String
    },
    weatherProtection: {
      type: Boolean,
      default: false
    }
  },
  costs: {
    baseRate: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Rate cannot be negative']
      },
      period: {
        type: String,
        enum: ['hour', 'day', 'week', 'flat'],
        default: 'day'
      }
    },
    additionalFees: [{
      description: String,
      amount: Number,
      required: {
        type: Boolean,
        default: false
      }
    }],
    deposit: {
      amount: Number,
      refundable: {
        type: Boolean,
        default: true
      }
    },
    insurance: {
      required: {
        type: Boolean,
        default: false
      },
      minimumCoverage: Number,
      notes: String
    }
  },
  permits: {
    required: {
      type: Boolean,
      default: false
    },
    types: [String], // e.g., "filming permit", "parking permit"
    obtainedBy: {
      type: String,
      enum: ['production', 'location-owner', 'third-party'],
      default: 'production'
    },
    cost: Number,
    processingTime: Number, // days
    notes: String
  },
  features: {
    indoorSpaces: [{
      name: String,
      size: String, // e.g., "20x30 feet"
      capacity: Number,
      description: String
    }],
    outdoorSpaces: [{
      name: String,
      size: String,
      terrain: String,
      description: String
    }],
    specialFeatures: [String], // e.g., "fireplace", "pool", "elevator"
    architecture: String,
    period: String, // historical period if relevant
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  media: {
    photos: [{
      url: String,
      caption: String,
      category: {
        type: String,
        enum: ['exterior', 'interior', 'aerial', 'detail', 'reference'],
        default: 'exterior'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    videos: [{
      url: String,
      caption: String,
      duration: Number, // seconds
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    floorPlans: [{
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  scenes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Scene'
  }],
  schedules: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Schedule'
  }],
  status: {
    type: String,
    enum: ['scouting', 'approved', 'booked', 'confirmed', 'completed', 'cancelled', 'unavailable'],
    default: 'scouting'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  rating: {
    overall: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    accessibility: {
      type: Number,
      min: 1,
      max: 5
    },
    facilities: {
      type: Number,
      min: 1,
      max: 5
    },
    cooperation: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  notes: String,
  tags: [String],
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
locationSchema.index({ project: 1 });
locationSchema.index({ project: 1, status: 1 });
locationSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
locationSchema.index({ type: 1, category: 1 });
locationSchema.index({ 'address.city': 1, 'address.state': 1 });
locationSchema.index({ tags: 1 });

// 2dsphere index for geospatial queries
locationSchema.index({ coordinates: '2dsphere' });

// Virtual for total photos count
locationSchema.virtual('totalPhotos').get(function() {
  return this.media.photos.length;
});

// Virtual for formatted address
locationSchema.virtual('formattedAddress').get(function() {
  if (this.address.fullAddress) {
    return this.address.fullAddress;
  }
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ');
});

// Virtual for daily rate
locationSchema.virtual('dailyRate').get(function() {
  if (this.costs.baseRate.period === 'day') {
    return this.costs.baseRate.amount;
  } else if (this.costs.baseRate.period === 'hour') {
    return this.costs.baseRate.amount * 12; // Assume 12 hour day
  }
  return this.costs.baseRate.amount;
});

// Static method to find locations near coordinates
locationSchema.statics.findNear = function(lat, lng, maxDistance = 10000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance // meters
      }
    }
  });
};

// Static method to search locations
locationSchema.statics.search = function(projectId, searchOptions = {}) {
  const query = { project: projectId };
  
  if (searchOptions.type) {
    query.type = searchOptions.type;
  }
  
  if (searchOptions.category) {
    query.category = searchOptions.category;
  }
  
  if (searchOptions.city) {
    query['address.city'] = new RegExp(searchOptions.city, 'i');
  }
  
  if (searchOptions.tags && searchOptions.tags.length > 0) {
    query.tags = { $in: searchOptions.tags };
  }
  
  if (searchOptions.maxRate) {
    query['costs.baseRate.amount'] = { $lte: searchOptions.maxRate };
  }
  
  if (searchOptions.features && searchOptions.features.length > 0) {
    query.specialFeatures = { $in: searchOptions.features };
  }
  
  return this.find(query)
    .populate('scenes', 'sceneNumber title')
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Instance method to calculate distance from point
locationSchema.methods.distanceFrom = function(lat, lng) {
  if (!this.coordinates.latitude || !this.coordinates.longitude) {
    return null;
  }
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = this.toRadians(lat - this.coordinates.latitude);
  const dLng = this.toRadians(lng - this.coordinates.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRadians(this.coordinates.latitude)) * Math.cos(this.toRadians(lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper method to convert degrees to radians
locationSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

// Instance method to check availability for date range
locationSchema.methods.isAvailable = function(startDate, endDate) {
  // Check blackout dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (const blackoutDate of this.availability.blackoutDates) {
    const blackout = new Date(blackoutDate);
    if (blackout >= start && blackout <= end) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('Location', locationSchema);