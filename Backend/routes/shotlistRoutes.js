const express = require('express');
const shotlistController = require('../controllers/shotlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate shotlist routes
router.get('/projects/:projectId/shotlist', shotlistController.createShotlist);
router.get('/scenes/:sceneId/shotlist', shotlistController.getShotlistByScene);

// Export shotlist routes
router.get('/projects/:projectId/shotlist/export', shotlistController.exportShotlist);

// Equipment and analysis routes
router.get('/projects/:projectId/equipment-list', shotlistController.generateEquipmentList);
router.get('/projects/:projectId/coverage-analysis', shotlistController.getCoverageAnalysis);

module.exports = router;