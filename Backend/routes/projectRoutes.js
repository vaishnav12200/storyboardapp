const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult, param } = require('express-validator');

const router = express.Router();

// All project routes require authentication
router.use(protect);

// Validation rules
const createProjectValidation = [
  body('title')
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters')
    .trim(),
    
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),
    
  body('director')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Director name cannot exceed 100 characters')
    .trim(),
    
  body('producer')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Producer name cannot exceed 100 characters')
    .trim(),
    
  body('genre')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value) {
        const validGenres = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 
                           'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi', 
                           'thriller', 'western', 'other'];
        if (!validGenres.includes(value.toLowerCase())) {
          throw new Error('Invalid genre');
        }
      }
      return true;
    }),
    
  body('budget')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value !== undefined && value !== null && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error('Budget must be a positive number');
        }
      }
      return true;
    }),
    
  body('startDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value && !Date.parse(value)) {
        throw new Error('Invalid start date format');
      }
      return true;
    }),
    
  body('endDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value, { req }) => {
      if (value && !Date.parse(value)) {
        throw new Error('Invalid end date format');
      }
      if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

const projectIdValidation = [
  param('projectId').isMongoId().withMessage('Invalid project ID')
];

// Get all projects for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { owner: req.user.userId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }
    
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'firstName lastName email');
      
    const total = await Project.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get project by ID
router.get('/:projectId', projectIdValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user.userId
    }).populate('owner', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new project
router.post('/', createProjectValidation, async (req, res) => {
  try {
    console.log('Received project data:', JSON.stringify(req.body, null, 2));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const projectData = {
      title: req.body.title,
      description: req.body.description,
      genre: req.body.genre ? req.body.genre.toLowerCase() : undefined,
      owner: req.user.userId,
      status: 'planning' // Default status
    };
    
    // Handle budget
    if (req.body.budget) {
      projectData.budget = {
        total: req.body.budget,
        currency: 'USD'
      };
    }
    
    // Handle timeline
    if (req.body.startDate || req.body.endDate) {
      projectData.timeline = {};
      if (req.body.startDate) projectData.timeline.startDate = new Date(req.body.startDate);
      if (req.body.endDate) projectData.timeline.endDate = new Date(req.body.endDate);
    }
    
    // Handle collaborators (director, producer)
    projectData.collaborators = [];
    if (req.body.director) {
      projectData.collaborators.push({
        role: 'director',
        permissions: ['read', 'write']
      });
    }
    if (req.body.producer) {
      projectData.collaborators.push({
        role: 'producer', 
        permissions: ['read', 'write']
      });
    }
    
    const project = new Project(projectData);
    await project.save();
    
    // Populate the owner field for response
    await project.populate('owner', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update project
router.put('/:projectId', [...projectIdValidation, ...createProjectValidation], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const project = await Project.findOneAndUpdate(
      { _id: req.params.projectId, owner: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete project
router.delete('/:projectId', projectIdValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const project = await Project.findOneAndDelete({
      _id: req.params.projectId,
      owner: req.user.userId
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;