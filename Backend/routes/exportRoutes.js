const express = require('express');
const exportController = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Export individual components
router.get('/storyboard/:projectId', exportController.exportStoryboard);
router.get('/script/:projectId', exportController.exportScript);
router.get('/schedule/:projectId', exportController.exportSchedule);
router.get('/budget/:projectId', exportController.exportBudget);

// Export complete project
router.get('/project/:projectId', exportController.exportProject);

// Special exports
router.get('/presentation/:projectId', exportController.exportPresentation);
router.get('/analytics/:projectId', exportController.exportAnalytics);

// Import project
router.post('/import', exportController.importProject);

module.exports = router;