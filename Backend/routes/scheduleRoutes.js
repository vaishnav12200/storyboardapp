const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const {
  createScheduleValidation,
  updateScheduleValidation,
  scheduleIdValidation,
  projectIdValidation,
  addCrewMemberValidation,
  statusUpdateValidation
} = require('../validators/scheduleValidator');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Schedule CRUD routes
router.post('/projects/:projectId/schedules', projectIdValidation, createScheduleValidation, scheduleController.createSchedule);
router.get('/projects/:projectId/schedules', projectIdValidation, scheduleController.getSchedules);
router.get('/schedules/:scheduleId', scheduleIdValidation, scheduleController.getSchedule);
router.put('/schedules/:scheduleId', scheduleIdValidation, updateScheduleValidation, scheduleController.updateSchedule);
router.delete('/schedules/:scheduleId', scheduleIdValidation, scheduleController.deleteSchedule);

// Calendar and view routes
router.get('/projects/:projectId/calendar', projectIdValidation, scheduleController.getCalendarView);
router.get('/projects/:projectId/conflicts', projectIdValidation, scheduleController.getConflicts);

// Schedule status management
router.patch('/schedules/:scheduleId/status', scheduleIdValidation, statusUpdateValidation, scheduleController.updateStatus);

// Crew management
router.post('/schedules/:scheduleId/crew', scheduleIdValidation, addCrewMemberValidation, scheduleController.addCrewMember);
router.delete('/schedules/:scheduleId/crew/:userId', scheduleIdValidation, scheduleController.removeCrewMember);

module.exports = router;