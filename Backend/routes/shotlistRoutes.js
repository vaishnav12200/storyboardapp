const express = require('express');
const shotlistController = require('../controllers/shotlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Frontend-compatible routes for shot CRUD operations
// Get all shots for a project
router.get('/projects/:projectId', shotlistController.getShots);

// Create a new shot (supports both patterns)
router.post('/projects/:projectId/shotlists', shotlistController.createShot);
router.post('/projects/:projectId/shots', shotlistController.createShot);
router.post('/projects/:projectId/shotlists/:shotListId/shots', shotlistController.createShot);

// Update a shot
router.put('/projects/:projectId/shots/:shotId', shotlistController.updateShot);

// Delete a shot
router.delete('/projects/:projectId/shots/:shotId', shotlistController.deleteShot);

// Legacy routes (kept for backward compatibility)
// Generate shotlist routes
router.get('/projects/:projectId/shotlist', shotlistController.createShotlist);
router.get('/scenes/:sceneId/shotlist', shotlistController.getShotlistByScene);

// Export shotlist routes
router.get('/projects/:projectId/shotlist/export', shotlistController.exportShotlist);

// Equipment and analysis routes
router.get('/projects/:projectId/equipment-list', shotlistController.generateEquipmentList);
router.get('/projects/:projectId/coverage-analysis', shotlistController.getCoverageAnalysis);

module.exports = router;