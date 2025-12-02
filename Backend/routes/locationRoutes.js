const express = require('express');
const multer = require('multer');
const locationController = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');
const storageService = require('../services/storageService');

const router = express.Router();

// Configure multer for photo uploads
const upload = storageService.getMulterConfig({ 
  fileType: 'image', 
  maxSize: 5 * 1024 * 1024 // 5MB
});

// All routes require authentication
router.use(protect);

// Location CRUD routes - matching frontend expectations
router.post('/projects/:projectId', locationController.createLocation);
router.get('/projects/:projectId', locationController.getLocations);
router.get('/locations/:locationId', locationController.getLocation);
router.put('/locations/:locationId', locationController.updateLocation);
router.delete('/locations/:locationId', locationController.deleteLocation);

// Legacy routes for backward compatibility
router.post('/projects/:projectId/locations', locationController.createLocation);
router.get('/projects/:projectId/locations', locationController.getLocations);

// Search and filtering routes
router.get('/projects/:projectId/locations/search/nearby', locationController.searchNearby);
router.post('/projects/:projectId/locations/search/advanced', locationController.advancedSearch);
router.get('/locations/:locationId/availability', locationController.checkAvailability);

// Photo management routes
router.post('/locations/:locationId/photos', upload.array('photos', 10), locationController.uploadPhotos);
router.delete('/locations/:locationId/photos/:photoId', locationController.deletePhoto);

// Analytics and bulk operations
router.get('/projects/:projectId/locations/stats', locationController.getLocationStats);
router.patch('/projects/:projectId/locations/bulk-update', locationController.bulkUpdate);

// Export routes
router.get('/projects/:projectId/locations/export', locationController.exportLocations);

module.exports = router;