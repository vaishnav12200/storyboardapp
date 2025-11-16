const express = require('express');
const storyboardController = require('../controllers/storyboardController');
const { protect, checkProjectAccess } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project routes
router.post('/projects', storyboardController.createProject);
router.get('/projects', storyboardController.getProjects);
router.get('/projects/:projectId', storyboardController.getProject);
router.put('/projects/:projectId', storyboardController.updateProject);
router.delete('/projects/:projectId', storyboardController.deleteProject);
router.patch('/projects/:projectId/archive', storyboardController.archiveProject);

// Project collaboration routes
router.post('/projects/:projectId/collaborators', storyboardController.addCollaborator);
router.delete('/projects/:projectId/collaborators/:userId', storyboardController.removeCollaborator);

// Scene routes
router.post('/projects/:projectId/scenes', storyboardController.createScene);
router.get('/projects/:projectId/scenes', storyboardController.getScenes);
router.get('/scenes/:sceneId', storyboardController.getScene);
router.put('/scenes/:sceneId', storyboardController.updateScene);
router.delete('/scenes/:sceneId', storyboardController.deleteScene);
router.post('/scenes/:sceneId/duplicate', storyboardController.duplicateScene);
router.patch('/projects/:projectId/scenes/reorder', storyboardController.reorderScenes);

// Storyboard panel routes
router.post('/scenes/:sceneId/panels', storyboardController.addStoryboardPanel);
router.put('/scenes/:sceneId/panels/:panelId', storyboardController.updateStoryboardPanel);
router.delete('/scenes/:sceneId/panels/:panelId', storyboardController.deleteStoryboardPanel);

// AI-powered storyboard routes
router.post('/scenes/:sceneId/panels/:panelId/generate-image', storyboardController.generatePanelImage);
router.post('/scenes/:sceneId/panels/:panelId/regenerate-image', storyboardController.regeneratePanelImage);
router.get('/scenes/:sceneId/panels/:panelId/generation-history', storyboardController.getPanelGenerationHistory);
router.post('/scenes/:sceneId/generate-script', storyboardController.generateScriptSuggestions);
router.post('/scenes/:sceneId/bulk-generate-images', storyboardController.bulkGeneratePanelImages);

// AI analysis routes
router.post('/projects/:projectId/analyze-storyboard', storyboardController.analyzeStoryboard);
router.get('/ai/providers', storyboardController.getAIProviders);

// Statistics routes
router.get('/projects/:projectId/stats', storyboardController.getProjectStats);

module.exports = router;