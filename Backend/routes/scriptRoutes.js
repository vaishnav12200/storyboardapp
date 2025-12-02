const express = require('express');
const scriptController = require('../controllers/scriptController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project script routes
router.get('/projects/:projectId', scriptController.getProjectScript);
router.put('/projects/:projectId', scriptController.updateProjectScript);
router.get('/projects/:projectId/characters', scriptController.getCharacters);

// Scene script routes
router.get('/scenes/:sceneId', scriptController.getSceneScript);
router.put('/scenes/:sceneId', scriptController.updateSceneScript);

// Dialogue routes
router.post('/scenes/:sceneId/dialogue', scriptController.addDialogue);
router.put('/scenes/:sceneId/dialogue/:dialogueIndex', scriptController.updateDialogue);
router.delete('/scenes/:sceneId/dialogue/:dialogueIndex', scriptController.deleteDialogue);

// Formatting routes
router.post('/scenes/:sceneId/format', scriptController.autoFormat);

module.exports = router;