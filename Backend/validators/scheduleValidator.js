const { body, param } = require('express-validator');

// Validation rules for creating schedule
const createScheduleValidation = [
  body('title')
    .notEmpty()
    .withMessage('Schedule title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters')
    .trim(),

  body('type')
    .isIn(['shooting', 'pre-production', 'post-production', 'meeting', 'other'])
    .withMessage('Invalid schedule type'),

  body('date')
    .isISO8601()
    .withMessage('Date must be in valid ISO format')
    .custom((value) => {
      const scheduleDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduleDate < today) {
        throw new Error('Schedule date cannot be in the past');
      }
      return true;
    }),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((endTime, { req }) => {
      const startTime = req.body.startTime;
      if (startTime && endTime) {
        const start = startTime.split(':').map(Number);
        const end = endTime.split(':').map(Number);
        
        const startMinutes = start[0] * 60 + start[1];
        const endMinutes = end[0] * 60 + end[1];
        
        if (endMinutes <= startMinutes) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),

  body('location')
    .optional()
    .isString()
    .trim(),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (minutes)'),

  body('timeSlot.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('timeSlot.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),

  body('location.name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location name cannot be more than 200 characters')
    .trim(),

  body('location.address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Location address cannot be more than 500 characters')
    .trim(),

  body('location.coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('location.coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('scenes')
    .optional()
    .isArray()
    .withMessage('Scenes must be an array'),

  body('scenes.*.scene')
    .optional()
    .isMongoId()
    .withMessage('Scene ID must be a valid MongoDB ObjectId'),

  body('scenes.*.estimatedDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be a positive integer (minutes)'),

  body('crew')
    .optional()
    .isArray()
    .withMessage('Crew must be an array'),

  body('crew.*.member')
    .optional()
    .isMongoId()
    .withMessage('Crew member ID must be a valid MongoDB ObjectId'),

  body('crew.*.role')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Crew role must be between 2 and 100 characters')
    .trim(),

  body('crew.*.callTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Call time must be in HH:MM format'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),

  body('status')
    .optional()
    .isIn(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled', 'postponed'])
    .withMessage('Invalid status')
];

// Validation rules for updating schedule
const updateScheduleValidation = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot be more than 1000 characters')
    .trim(),

  body('type')
    .optional()
    .isIn(['shooting', 'pre-production', 'post-production', 'meeting', 'other'])
    .withMessage('Invalid schedule type'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in valid ISO format'),

  body('timeSlot.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('timeSlot.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),

  body('status')
    .optional()
    .isIn(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled', 'postponed'])
    .withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level')
];

// Validation for schedule ID parameter
const scheduleIdValidation = [
  param('scheduleId')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

// Validation for project ID parameter
const projectIdValidation = [
  param('projectId')
    .isMongoId()
    .withMessage('Invalid project ID format')
];

// Validation for adding crew member
const addCrewMemberValidation = [
  body('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Role must be between 2 and 100 characters')
    .trim(),

  body('callTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Call time must be in HH:MM format'),

  body('wrapTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Wrap time must be in HH:MM format'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
    .trim()
];

// Validation for status update
const statusUpdateValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'confirmed', 'in-progress', 'completed', 'cancelled', 'postponed'])
    .withMessage('Invalid status')
];

// Validation for calendar view query
const calendarViewValidation = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in valid ISO format'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in valid ISO format'),

  body('view')
    .optional()
    .isIn(['week', 'month'])
    .withMessage('View must be either week or month')
];

// Validation for conflict check
const conflictCheckValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid ISO format'),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

module.exports = {
  createScheduleValidation,
  updateScheduleValidation,
  scheduleIdValidation,
  projectIdValidation,
  addCrewMemberValidation,
  statusUpdateValidation,
  calendarViewValidation,
  conflictCheckValidation
};