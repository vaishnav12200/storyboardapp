const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Scene must belong to a project']
  },
  sceneNumber: {
    type: Number,
    required: [true, 'Scene number is required']
  },
  title: {
    type: String,
    required: [true, 'Scene title is required'],
    trim: true,
    maxlength: [200, 'Scene title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Scene description cannot be more than 1000 characters']
  },
  location: {
    name: String,
    type: {
      type: String,
      enum: ['interior', 'exterior', 'int/ext'],
      default: 'interior'
    },
    timeOfDay: {
      type: String,
      enum: ['day', 'night', 'dawn', 'dusk', 'continuous'],
      default: 'day'
    },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  duration: {
    estimated: {
      type: Number, // in seconds
      default: 0
    },
    actual: Number
  },
  script: {
    action: String,
    dialogue: [{
      character: String,
      text: String,
      notes: String
    }],
    notes: String
  },
  storyboard: {
    panels: [{
      panelNumber: {
        type: Number,
        required: true
      },
      
      // Image handling - supports both uploaded and AI-generated
      image: String, // Final image URL (uploaded or AI-generated)
      
      // Image source tracking
      imageSource: {
        type: {
          type: String,
          enum: ['uploaded', 'ai-generated'],
          default: 'uploaded'
        },
        
        // AI generation details (only if ai-generated)
        aiGeneration: {
          provider: {
            type: String,
            enum: ['openai', 'stability', 'replicate']
          },
          originalPrompt: String,
          enhancedPrompt: String,
          generationId: String,
          settings: {
            style: String,
            aspectRatio: String,
            mood: String,
            shotType: String,
            cameraMovement: String
          },
          generatedAt: Date,
          revisedPrompt: String, // For OpenAI DALL-E revised prompts
          
          // Regeneration history
          previousGenerations: [{
            imageUrl: String,
            prompt: String,
            generatedAt: Date,
            settings: Object
          }]
        },
        
        // Upload details (only if uploaded)
        uploadDetails: {
          originalName: String,
          fileSize: Number,
          uploadedAt: Date,
          uploadedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
          }
        }
      },
      
      // Panel content
      description: String,
      shotType: {
        type: String,
        enum: ['wide-shot', 'medium-shot', 'close-up', 'extreme-close-up', 'over-shoulder', 'pov', 'establishing', 'insert'],
        default: 'medium-shot'
      },
      cameraMovement: {
        type: String,
        enum: ['static', 'pan', 'tilt', 'zoom', 'dolly', 'crane', 'handheld', 'steadicam'],
        default: 'static'
      },
      angle: {
        type: String,
        enum: ['eye-level', 'high-angle', 'low-angle', 'bird-eye', 'worm-eye'],
        default: 'eye-level'
      },
      duration: Number, // in seconds
      notes: String,
      
      // AI-powered suggestions
      aiSuggestions: {
        suggestedShots: [String],
        suggestedMovements: [String],
        suggestedAngles: [String],
        improvementTips: [String],
        generatedAt: Date
      },
      
      // Panel metadata
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastModified: {
        type: Date,
        default: Date.now
      }
    }],
    totalPanels: {
      type: Number,
      default: 0
    },
    
    // AI analysis for the entire storyboard
    aiAnalysis: {
      lastAnalyzedAt: Date,
      suggestions: [String],
      shotVariety: {
        wideShots: Number,
        mediumShots: Number,
        closeUps: Number,
        varietyScore: Number // 0-100
      },
      pacing: {
        averagePanelsPerScene: Number,
        pacingScore: Number, // 0-100
        recommendations: [String]
      },
      visualFlow: {
        flowScore: Number, // 0-100
        transitions: [String],
        recommendations: [String]
      }
    }
  },
  characters: [{
    name: String,
    role: {
      type: String,
      enum: ['lead', 'supporting', 'background', 'extra'],
      default: 'supporting'
    },
    costume: String,
    makeup: String,
    notes: String
  }],
  props: [{
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['set-decoration', 'hand-prop', 'costume', 'special-effect', 'vehicle', 'weapon'],
      default: 'hand-prop'
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  equipment: [{
    name: String,
    type: {
      type: String,
      enum: ['camera', 'lens', 'lighting', 'audio', 'grip', 'other'],
      default: 'other'
    },
    notes: String
  }],
  crew: [{
    role: String,
    name: String,
    contact: String
  }],
  schedule: {
    plannedDate: Date,
    actualDate: Date,
    timeSlot: {
      start: String, // "HH:MM" format
      end: String
    },
    status: {
      type: String,
      enum: ['not-scheduled', 'scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'not-scheduled'
    }
  },
  budget: {
    estimated: {
      type: Number,
      default: 0
    },
    actual: Number
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'in-progress', 'completed', 'needs-revision'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  tags: [String],
  notes: String,
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
sceneSchema.index({ project: 1, sceneNumber: 1 });
sceneSchema.index({ project: 1, status: 1 });
sceneSchema.index({ project: 1, 'schedule.plannedDate': 1 });
sceneSchema.index({ 'location.name': 1 });

// Compound unique index to prevent duplicate scene numbers in same project
sceneSchema.index({ project: 1, sceneNumber: 1 }, { unique: true });

// Virtual for estimated total duration
sceneSchema.virtual('totalEstimatedDuration').get(function() {
  return this.storyboard.panels.reduce((total, panel) => total + (panel.duration || 0), 0);
});

// Virtual for shot count
sceneSchema.virtual('shotCount').get(function() {
  return this.storyboard.totalPanels || 0;
});

// Pre-save middleware to update panel count and last modified
sceneSchema.pre('save', function(next) {
  if (this.storyboard.panels) {
    this.storyboard.totalPanels = this.storyboard.panels.length;
  }
  
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Static method to get next scene number for a project
sceneSchema.statics.getNextSceneNumber = async function(projectId) {
  const lastScene = await this.findOne({ project: projectId })
    .sort({ sceneNumber: -1 });
  
  return lastScene ? lastScene.sceneNumber + 1 : 1;
};

// Instance method to duplicate scene
sceneSchema.methods.duplicate = function() {
  const duplicatedScene = this.toObject();
  delete duplicatedScene._id;
  delete duplicatedScene.createdAt;
  delete duplicatedScene.updatedAt;
  duplicatedScene.title += ' (Copy)';
  duplicatedScene.status = 'draft';
  
  return new this.constructor(duplicatedScene);
};

module.exports = mongoose.model('Scene', sceneSchema);