const Location = require('../models/Location');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class LocationController {
  // Create new location
  async createLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has write permission
      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const locationData = {
        ...req.body,
        project: projectId,
        createdBy: req.user.userId
      };

      const location = new Location(locationData);
      await location.save();

      await location.populate([
        { path: 'project', select: 'title' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all locations for a project
  async getLocations(req, res) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, type, status, city, search } = req.query;
      const skip = (page - 1) * limit;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const query = { project: projectId };
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (city) query['address.city'] = new RegExp(city, 'i');
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { 'address.fullAddress': new RegExp(search, 'i') }
        ];
      }

      const locations = await Location.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('scenes', 'sceneNumber title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Location.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          locations,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get single location
  async getLocation(req, res) {
    try {
      const { locationId } = req.params;

      const location = await Location.findById(locationId)
        .populate('project', 'title owner collaborators')
        .populate('createdBy', 'firstName lastName email')
        .populate('scenes', 'sceneNumber title status')
        .populate('schedules', 'title date status');

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has access to the project
      const hasAccess = location.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update location
  async updateLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { locationId } = req.params;

      const location = await Location.findById(locationId).populate('project');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has write permission
      const hasAccess = location.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.userId
      };

      Object.assign(location, updateData);
      await location.save();

      await location.populate([
        { path: 'createdBy', select: 'firstName lastName email' },
        { path: 'lastModifiedBy', select: 'firstName lastName email' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: location
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete location
  async deleteLocation(req, res) {
    try {
      const { locationId } = req.params;

      const location = await Location.findById(locationId).populate('project');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = location.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Location.findByIdAndDelete(locationId);

      res.status(200).json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete location photo
  async deletePhoto(req, res) {
    try {
      const { locationId, photoId } = req.params;

      const location = await Location.findById(locationId).populate('project');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = location.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const photo = location.media.photos.id(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          message: 'Photo not found'
        });
      }

      // Delete from storage service if needed
      try {
        const storageService = require('../services/storageService');
        await storageService.deleteFile(photo.url);
      } catch (storageError) {
        console.error('Failed to delete photo from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      location.media.photos.id(photoId).remove();
      await location.save();

      res.status(200).json({
        success: true,
        message: 'Photo deleted successfully',
        data: {
          locationId: location._id,
          remainingPhotos: location.media.photos.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get location statistics
  async getLocationStats(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const stats = await Location.aggregate([
        { $match: { project: project._id } },
        {
          $group: {
            _id: null,
            totalLocations: { $sum: 1 },
            byType: {
              $push: {
                type: '$type',
                category: '$category',
                status: '$status'
              }
            },
            averageRating: { $avg: '$rating.overall' },
            totalPhotos: { $sum: { $size: '$media.photos' } },
            locationsWithCoordinates: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$coordinates.latitude', null] },
                    { $ne: ['$coordinates.longitude', null] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const locationStats = stats[0] || {
        totalLocations: 0,
        byType: [],
        averageRating: 0,
        totalPhotos: 0,
        locationsWithCoordinates: 0
      };

      // Process type/category/status counts
      const typeCounts = {};
      const categoryCounts = {};
      const statusCounts = {};

      locationStats.byType.forEach(item => {
        typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });

      const processedStats = {
        ...locationStats,
        byType: typeCounts,
        byCategory: categoryCounts,
        byStatus: statusCounts,
        coordinatesCoverage: locationStats.totalLocations > 0 ? 
          Math.round((locationStats.locationsWithCoordinates / locationStats.totalLocations) * 100) : 0
      };

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            title: project.title
          },
          stats: processedStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk update locations
  async bulkUpdate(req, res) {
    try {
      const { projectId } = req.params;
      const { locationIds, updateData } = req.body;

      if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Location IDs array is required'
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has write permission
      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate that all locations belong to the project
      const locations = await Location.find({
        _id: { $in: locationIds },
        project: projectId
      });

      if (locations.length !== locationIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some locations not found or do not belong to this project'
        });
      }

      // Perform bulk update
      const allowedFields = ['status', 'priority', 'tags', 'rating'];
      const filteredUpdateData = {};

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdateData[key] = updateData[key];
        }
      });

      filteredUpdateData.lastModifiedBy = req.user.userId;

      const result = await Location.updateMany(
        { _id: { $in: locationIds } },
        { $set: filteredUpdateData }
      );

      res.status(200).json({
        success: true,
        message: 'Locations updated successfully',
        data: {
          updatedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export locations data
  async exportLocations(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'json' } = req.query;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const locations = await Location.find({ project: projectId })
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        let csv = 'Name,Type,Category,Status,Address,Coordinates,Rating,Photos,Created\n';
        
        locations.forEach(location => {
          const address = location.formattedAddress || '';
          const coords = location.coordinates.latitude && location.coordinates.longitude ? 
            `${location.coordinates.latitude},${location.coordinates.longitude}` : '';
          
          csv += `"${location.name}","${location.type}","${location.category}","${location.status}","${address}","${coords}",${location.rating.overall || 0},${location.media.photos.length},"${location.createdAt.toISOString()}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-locations.csv"`);
        return res.send(csv);
      }

      // Default JSON format
      const exportData = {
        project: {
          id: project._id,
          title: project.title
        },
        locations: locations.map(location => location.toObject()),
        totalLocations: locations.length,
        exportedAt: new Date()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}-locations.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Search locations near coordinates
  async searchNearby(req, res) {
    try {
      const { projectId } = req.params;
      const { lat, lng, maxDistance = 10000 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const nearbyLocations = await Location.findNear(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(maxDistance)
      ).where('project').equals(projectId);

      // Calculate distances and add to results
      const locationsWithDistance = nearbyLocations.map(location => {
        const distance = location.distanceFrom(parseFloat(lat), parseFloat(lng));
        return {
          ...location.toObject(),
          distance: distance ? Math.round(distance * 100) / 100 : null // Round to 2 decimal places
        };
      });

      res.status(200).json({
        success: true,
        data: {
          searchCenter: { lat: parseFloat(lat), lng: parseFloat(lng) },
          maxDistance: parseInt(maxDistance),
          locations: locationsWithDistance,
          total: locationsWithDistance.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Advanced location search
  async advancedSearch(req, res) {
    try {
      const { projectId } = req.params;
      const searchOptions = req.body;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const locations = await Location.search(projectId, searchOptions);

      res.status(200).json({
        success: true,
        data: {
          searchOptions,
          locations,
          total: locations.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check location availability
  async checkAvailability(req, res) {
    try {
      const { locationId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const location = await Location.findById(locationId).populate('project');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has read permission
      const hasAccess = location.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const isAvailable = location.isAvailable(startDate, endDate);

      res.status(200).json({
        success: true,
        data: {
          locationId: location._id,
          locationName: location.name,
          dateRange: { startDate, endDate },
          isAvailable,
          restrictions: {
            timeRestrictions: location.availability.timeRestrictions,
            seasonalRestrictions: location.availability.seasonalRestrictions,
            blackoutDates: location.availability.blackoutDates
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Upload location photos
  async uploadPhotos(req, res) {
    try {
      const { locationId } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const location = await Location.findById(locationId).populate('project');
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Check if user has write permission
      const hasAccess = location.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const storageService = require('../services/storageService');
      const uploadResults = [];

      for (const file of files) {
        try {
          const result = await storageService.uploadFile(file, {
            folder: `locations/${locationId}`,
            transformation: storageService.getImageTransformations().large
          });

          const photo = {
            url: result.url,
            caption: req.body.caption || '',
            category: req.body.category || 'exterior',
            uploadedAt: new Date()
          };

          location.media.photos.push(photo);
          uploadResults.push({ success: true, photo, originalName: file.originalname });
        } catch (uploadError) {
          uploadResults.push({ 
            success: false, 
            error: uploadError.message, 
            originalName: file.originalname 
          });
        }
      }

      // Save the location with new photos
      await location.save();

      res.status(200).json({
        success: true,
        message: 'Photos uploaded successfully',
        data: {
          locationId: location._id,
          uploadResults,
          totalPhotos: location.media.photos.length,
          successfulUploads: uploadResults.filter(r => r.success).length,
          failedUploads: uploadResults.filter(r => !r.success).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new LocationController();