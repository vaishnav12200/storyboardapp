const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Schedule CRUD routes
router.post('/projects/:projectId/schedules', scheduleController.createSchedule);
router.get('/projects/:projectId/schedules', scheduleController.getSchedules);
router.get('/schedules/:scheduleId', scheduleController.getSchedule);
router.put('/schedules/:scheduleId', scheduleController.updateSchedule);
router.delete('/schedules/:scheduleId', scheduleController.deleteSchedule);

// Calendar and view routes
router.get('/projects/:projectId/calendar', scheduleController.getCalendarView);
router.get('/projects/:projectId/conflicts', scheduleController.getConflicts);

// Schedule status management
router.patch('/schedules/:scheduleId/status', scheduleController.updateStatus);

// Crew management
router.post('/schedules/:scheduleId/crew', scheduleController.addCrewMember);
router.delete('/schedules/:scheduleId/crew/:userId', scheduleController.removeCrewMember);

module.exports = router;