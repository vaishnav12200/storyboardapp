const Scene = require('../models/Scene');
const Shot = require('../models/Shot');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class ShotlistController {
  // Create a new shot
  async createShot(req, res) {
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

      const shotData = {
        ...req.body,
        project: projectId,
        createdBy: req.user.userId
      };

      // Map cameraAngle to angle if provided (frontend uses cameraAngle, backend uses angle)
      if (shotData.cameraAngle && !shotData.angle) {
        shotData.angle = shotData.cameraAngle;
        delete shotData.cameraAngle;
      }

      // Set shotName to shotNumber if not provided
      if (!shotData.shotName && shotData.shotNumber) {
        shotData.shotName = shotData.shotNumber;
      }

      const shot = new Shot(shotData);
      await shot.save();

      await shot.populate([
        { path: 'project', select: 'title' },
        { path: 'createdBy', select: 'firstName lastName email' },
        { path: 'scene', select: 'sceneNumber title' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Shot created successfully',
        data: shot
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all shots for a project
  async getShots(req, res) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 50, status, shotType, sceneId, search } = req.query;
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
      
      if (status) query.status = status;
      if (shotType) query.shotType = shotType;
      if (sceneId) query.scene = sceneId;
      if (search) {
        query.$or = [
          { shotNumber: new RegExp(search, 'i') },
          { shotName: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') }
        ];
      }

      const shots = await Shot.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('scene', 'sceneNumber title')
        .sort({ shotNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Shot.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          shots,
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

  // Update a shot
  async updateShot(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { shotId } = req.params;

      const shot = await Shot.findById(shotId).populate('project');
      if (!shot) {
        return res.status(404).json({
          success: false,
          message: 'Shot not found'
        });
      }

      // Check if user has write permission
      const hasAccess = shot.project.hasPermission(req.user.userId, 'write');
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

      // Map cameraAngle to angle if provided (frontend uses cameraAngle, backend uses angle)
      if (updateData.cameraAngle && !updateData.angle) {
        updateData.angle = updateData.cameraAngle;
        delete updateData.cameraAngle;
      }

      Object.assign(shot, updateData);
      await shot.save();

      await shot.populate([
        { path: 'createdBy', select: 'firstName lastName email' },
        { path: 'lastModifiedBy', select: 'firstName lastName email' },
        { path: 'scene', select: 'sceneNumber title' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Shot updated successfully',
        data: shot
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a shot
  async deleteShot(req, res) {
    try {
      const { shotId } = req.params;

      const shot = await Shot.findById(shotId).populate('project');
      if (!shot) {
        return res.status(404).json({
          success: false,
          message: 'Shot not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = shot.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Shot.findByIdAndDelete(shotId);

      res.status(200).json({
        success: true,
        message: 'Shot deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create shotlist from storyboard
  async createShotlist(req, res) {
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

      const scenes = await Scene.find({ project: projectId })
        .sort({ sceneNumber: 1 });

      const shotlist = this.generateShotlistFromScenes(scenes);

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            title: project.title
          },
          shotlist,
          totalShots: shotlist.length,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get shotlist by scene
  async getShotlistByScene(req, res) {
    try {
      const { sceneId } = req.params;

      const scene = await Scene.findById(sceneId)
        .populate('project', 'title owner collaborators');

      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has access to the project
      const hasAccess = scene.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const shotlist = this.generateShotlistFromScene(scene);

      res.status(200).json({
        success: true,
        data: {
          scene: {
            id: scene._id,
            sceneNumber: scene.sceneNumber,
            title: scene.title
          },
          shotlist,
          totalShots: shotlist.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export shotlist as CSV
  async exportShotlist(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'csv', sceneId } = req.query;

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

      let scenes;
      if (sceneId) {
        scenes = await Scene.find({ _id: sceneId, project: projectId });
      } else {
        scenes = await Scene.find({ project: projectId }).sort({ sceneNumber: 1 });
      }

      const shotlist = this.generateShotlistFromScenes(scenes);

      if (format === 'csv') {
        const csv = this.generateShotlistCSV(shotlist);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-shotlist.csv"`);
        res.send(csv);
      } else if (format === 'pdf') {
        const pdfService = require('../services/pdfService');
        const html = this.generateShotlistHTML(project, shotlist);
        const buffer = await pdfService.generateHTMLToPDF(html);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-shotlist.pdf"`);
        res.send(buffer);
      } else {
        // JSON format
        res.status(200).json({
          success: true,
          data: {
            project: { id: project._id, title: project.title },
            shotlist,
            totalShots: shotlist.length,
            exportedAt: new Date()
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate shotlist with equipment requirements
  async generateEquipmentList(req, res) {
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

      const scenes = await Scene.find({ project: projectId });
      const equipmentList = this.generateEquipmentListFromScenes(scenes);

      res.status(200).json({
        success: true,
        data: {
          project: { id: project._id, title: project.title },
          equipmentList,
          totalItems: equipmentList.reduce((sum, category) => sum + category.items.length, 0)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate coverage analysis
  async getCoverageAnalysis(req, res) {
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

      const scenes = await Scene.find({ project: projectId });
      const analysis = this.analyzeCoverage(scenes);

      res.status(200).json({
        success: true,
        data: {
          project: { id: project._id, title: project.title },
          analysis,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to generate shotlist from scenes
  generateShotlistFromScenes(scenes) {
    const shotlist = [];
    let shotNumber = 1;

    scenes.forEach(scene => {
      const sceneShots = this.generateShotlistFromScene(scene, shotNumber);
      shotlist.push(...sceneShots);
      shotNumber += sceneShots.length;
    });

    return shotlist;
  }

  // Helper method to generate shotlist from single scene
  generateShotlistFromScene(scene, startingShotNumber = 1) {
    const shots = [];
    let shotNumber = startingShotNumber;

    if (scene.storyboard && scene.storyboard.panels) {
      scene.storyboard.panels.forEach(panel => {
        const shot = {
          shotNumber,
          sceneNumber: scene.sceneNumber,
          sceneTitle: scene.title,
          panelNumber: panel.panelNumber,
          description: panel.description || `${panel.shotType} - ${panel.cameraMovement}`,
          shotType: panel.shotType || 'medium-shot',
          cameraMovement: panel.cameraMovement || 'static',
          angle: panel.angle || 'eye-level',
          duration: panel.duration || null,
          location: {
            name: scene.location?.name || '',
            type: scene.location?.type || '',
            timeOfDay: scene.location?.timeOfDay || ''
          },
          equipment: this.suggestEquipmentForShot(panel),
          crew: this.suggestCrewForShot(panel),
          notes: panel.notes || '',
          priority: this.calculateShotPriority(panel, scene),
          complexity: this.calculateShotComplexity(panel),
          estimatedSetupTime: this.estimateSetupTime(panel),
          status: 'planned'
        };

        shots.push(shot);
        shotNumber++;
      });
    }

    // If no storyboard panels, create a basic shot
    if (shots.length === 0) {
      shots.push({
        shotNumber,
        sceneNumber: scene.sceneNumber,
        sceneTitle: scene.title,
        panelNumber: 1,
        description: `Basic coverage for ${scene.title}`,
        shotType: 'medium-shot',
        cameraMovement: 'static',
        angle: 'eye-level',
        duration: null,
        location: {
          name: scene.location?.name || '',
          type: scene.location?.type || '',
          timeOfDay: scene.location?.timeOfDay || ''
        },
        equipment: ['camera', 'lens', 'tripod'],
        crew: ['camera-operator', 'focus-puller'],
        notes: 'Auto-generated shot',
        priority: 'medium',
        complexity: 'low',
        estimatedSetupTime: 15,
        status: 'planned'
      });
    }

    return shots;
  }

  // Helper method to suggest equipment for shot
  suggestEquipmentForShot(panel) {
    const equipment = ['camera', 'lens'];

    // Camera movement equipment
    switch (panel.cameraMovement) {
      case 'pan':
      case 'tilt':
        equipment.push('tripod', 'fluid-head');
        break;
      case 'dolly':
        equipment.push('dolly', 'track');
        break;
      case 'crane':
        equipment.push('crane');
        break;
      case 'handheld':
        equipment.push('shoulder-rig');
        break;
      case 'steadicam':
        equipment.push('steadicam');
        break;
      default:
        equipment.push('tripod');
    }

    // Angle-specific equipment
    if (panel.angle === 'high-angle' || panel.angle === 'low-angle') {
      equipment.push('extension-pole');
    }

    return equipment;
  }

  // Helper method to suggest crew for shot
  suggestCrewForShot(panel) {
    const crew = ['camera-operator'];

    // Movement-specific crew
    switch (panel.cameraMovement) {
      case 'dolly':
        crew.push('dolly-grip');
        break;
      case 'crane':
        crew.push('crane-operator');
        break;
      case 'steadicam':
        crew.push('steadicam-operator');
        break;
    }

    // Always suggest focus puller for complex shots
    if (panel.cameraMovement !== 'static' || panel.shotType === 'close-up') {
      crew.push('focus-puller');
    }

    return crew;
  }

  // Helper method to calculate shot priority
  calculateShotPriority(panel, scene) {
    if (scene.priority === 'critical' || panel.shotType === 'close-up') {
      return 'high';
    }
    if (panel.cameraMovement === 'crane' || panel.cameraMovement === 'dolly') {
      return 'high';
    }
    if (panel.shotType === 'wide-shot' || panel.cameraMovement === 'static') {
      return 'low';
    }
    return 'medium';
  }

  // Helper method to calculate shot complexity
  calculateShotComplexity(panel) {
    let complexity = 0;

    // Camera movement complexity
    switch (panel.cameraMovement) {
      case 'static': complexity += 1; break;
      case 'pan':
      case 'tilt': complexity += 2; break;
      case 'handheld': complexity += 3; break;
      case 'dolly': complexity += 4; break;
      case 'steadicam':
      case 'crane': complexity += 5; break;
    }

    // Shot type complexity
    switch (panel.shotType) {
      case 'wide-shot': complexity += 1; break;
      case 'medium-shot': complexity += 2; break;
      case 'close-up': complexity += 3; break;
      case 'extreme-close-up': complexity += 4; break;
    }

    if (complexity <= 3) return 'low';
    if (complexity <= 6) return 'medium';
    return 'high';
  }

  // Helper method to estimate setup time
  estimateSetupTime(panel) {
    let minutes = 10; // Base setup time

    // Camera movement time
    switch (panel.cameraMovement) {
      case 'static': minutes += 5; break;
      case 'pan':
      case 'tilt': minutes += 10; break;
      case 'handheld': minutes += 5; break;
      case 'dolly': minutes += 30; break;
      case 'steadicam': minutes += 20; break;
      case 'crane': minutes += 45; break;
    }

    // Lighting setup (estimated)
    if (panel.shotType === 'close-up') minutes += 15;
    if (panel.angle === 'high-angle' || panel.angle === 'low-angle') minutes += 10;

    return minutes;
  }

  // Helper method to generate equipment list
  generateEquipmentListFromScenes(scenes) {
    const equipmentMap = new Map();

    scenes.forEach(scene => {
      if (scene.storyboard?.panels) {
        scene.storyboard.panels.forEach(panel => {
          const equipment = this.suggestEquipmentForShot(panel);
          equipment.forEach(item => {
            if (!equipmentMap.has(item)) {
              equipmentMap.set(item, { name: item, count: 0, scenes: [] });
            }
            equipmentMap.get(item).count++;
            if (!equipmentMap.get(item).scenes.includes(scene.sceneNumber)) {
              equipmentMap.get(item).scenes.push(scene.sceneNumber);
            }
          });
        });
      }

      // Add equipment from scene equipment list
      if (scene.equipment) {
        scene.equipment.forEach(item => {
          if (!equipmentMap.has(item.name)) {
            equipmentMap.set(item.name, { name: item.name, count: 0, scenes: [] });
          }
          equipmentMap.get(item.name).count++;
          if (!equipmentMap.get(item.name).scenes.includes(scene.sceneNumber)) {
            equipmentMap.get(item.name).scenes.push(scene.sceneNumber);
          }
        });
      }
    });

    // Group by category
    const categories = {
      camera: { name: 'Camera Equipment', items: [] },
      lighting: { name: 'Lighting Equipment', items: [] },
      audio: { name: 'Audio Equipment', items: [] },
      grip: { name: 'Grip Equipment', items: [] },
      other: { name: 'Other Equipment', items: [] }
    };

    equipmentMap.forEach((equipment, name) => {
      const category = this.categorizeEquipment(name);
      categories[category].items.push(equipment);
    });

    return Object.values(categories).filter(cat => cat.items.length > 0);
  }

  // Helper method to categorize equipment
  categorizeEquipment(equipmentName) {
    const camera = ['camera', 'lens', 'monitor', 'battery', 'memory-card'];
    const lighting = ['light', 'softbox', 'reflector', 'diffuser', 'gel'];
    const audio = ['microphone', 'recorder', 'boom', 'wireless', 'headphones'];
    const grip = ['tripod', 'dolly', 'crane', 'steadicam', 'track', 'jib', 'slider'];

    if (camera.some(item => equipmentName.includes(item))) return 'camera';
    if (lighting.some(item => equipmentName.includes(item))) return 'lighting';
    if (audio.some(item => equipmentName.includes(item))) return 'audio';
    if (grip.some(item => equipmentName.includes(item))) return 'grip';
    return 'other';
  }

  // Helper method to analyze coverage
  analyzeCoverage(scenes) {
    const analysis = {
      shotTypes: {},
      cameraMovements: {},
      angles: {},
      totalShots: 0,
      averageShotsPerScene: 0,
      complexityDistribution: { low: 0, medium: 0, high: 0 },
      estimatedTotalSetupTime: 0
    };

    let totalShots = 0;
    let totalSetupTime = 0;

    scenes.forEach(scene => {
      if (scene.storyboard?.panels) {
        scene.storyboard.panels.forEach(panel => {
          totalShots++;
          
          // Count shot types
          const shotType = panel.shotType || 'medium-shot';
          analysis.shotTypes[shotType] = (analysis.shotTypes[shotType] || 0) + 1;

          // Count camera movements
          const movement = panel.cameraMovement || 'static';
          analysis.cameraMovements[movement] = (analysis.cameraMovements[movement] || 0) + 1;

          // Count angles
          const angle = panel.angle || 'eye-level';
          analysis.angles[angle] = (analysis.angles[angle] || 0) + 1;

          // Calculate complexity
          const complexity = this.calculateShotComplexity(panel);
          analysis.complexityDistribution[complexity]++;

          // Add setup time
          totalSetupTime += this.estimateSetupTime(panel);
        });
      }
    });

    analysis.totalShots = totalShots;
    analysis.averageShotsPerScene = scenes.length > 0 ? Math.round(totalShots / scenes.length * 10) / 10 : 0;
    analysis.estimatedTotalSetupTime = totalSetupTime;

    return analysis;
  }

  // Helper method to generate shotlist CSV
  generateShotlistCSV(shotlist) {
    let csv = 'Shot #,Scene #,Scene Title,Panel #,Description,Shot Type,Camera Movement,Angle,Duration,Equipment,Crew,Priority,Complexity,Setup Time,Status,Notes\n';
    
    shotlist.forEach(shot => {
      const equipment = Array.isArray(shot.equipment) ? shot.equipment.join(';') : shot.equipment || '';
      const crew = Array.isArray(shot.crew) ? shot.crew.join(';') : shot.crew || '';
      
      csv += `${shot.shotNumber},${shot.sceneNumber},"${shot.sceneTitle}",${shot.panelNumber},"${shot.description}","${shot.shotType}","${shot.cameraMovement}","${shot.angle}",${shot.duration || ''},"${equipment}","${crew}","${shot.priority}","${shot.complexity}",${shot.estimatedSetupTime},"${shot.status}","${shot.notes}"\n`;
    });
    
    return csv;
  }

  // Helper method to generate shotlist HTML for PDF
  generateShotlistHTML(project, shotlist) {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${project.title} - Shot List</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header h2 { font-size: 18px; color: #666; }
          .shot-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .shot-table th, .shot-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            vertical-align: top;
          }
          .shot-table th { background-color: #f5f5f5; font-weight: bold; }
          .scene-break { background-color: #e8f4f8; font-weight: bold; }
          .priority-high { background-color: #ffebee; }
          .priority-medium { background-color: #fff3e0; }
          .priority-low { background-color: #e8f5e8; }
          .complexity-high { color: #d32f2f; font-weight: bold; }
          .complexity-medium { color: #f57c00; }
          .complexity-low { color: #388e3c; }
          @media print { 
            body { margin: 10px; font-size: 10px; }
            .shot-table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${project.title}</h1>
          <h2>SHOT LIST</h2>
          <p>Total Shots: ${shotlist.length} | Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <table class="shot-table">
          <thead>
            <tr>
              <th>Shot #</th>
              <th>Scene</th>
              <th>Description</th>
              <th>Type</th>
              <th>Movement</th>
              <th>Angle</th>
              <th>Equipment</th>
              <th>Priority</th>
              <th>Setup Time</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    let currentScene = null;
    
    shotlist.forEach(shot => {
      if (currentScene !== shot.sceneNumber) {
        html += `
          <tr class="scene-break">
            <td colspan="10">SCENE ${shot.sceneNumber}: ${shot.sceneTitle}</td>
          </tr>
        `;
        currentScene = shot.sceneNumber;
      }

      const priorityClass = `priority-${shot.priority}`;
      const complexityClass = `complexity-${shot.complexity}`;
      const equipment = Array.isArray(shot.equipment) ? shot.equipment.join(', ') : shot.equipment || '';

      html += `
        <tr class="${priorityClass}">
          <td>${shot.shotNumber}</td>
          <td>${shot.sceneNumber}</td>
          <td>${shot.description}</td>
          <td>${shot.shotType.replace('-', ' ')}</td>
          <td>${shot.cameraMovement.replace('-', ' ')}</td>
          <td>${shot.angle.replace('-', ' ')}</td>
          <td style="font-size: 10px;">${equipment}</td>
          <td class="${complexityClass}">${shot.priority.toUpperCase()}</td>
          <td>${shot.estimatedSetupTime}min</td>
          <td style="font-size: 10px;">${shot.notes}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 10px;">
          <h3>Legend:</h3>
          <p><strong>Priority Colors:</strong> 
            <span style="background-color: #ffebee; padding: 2px 5px;">High</span>
            <span style="background-color: #fff3e0; padding: 2px 5px;">Medium</span>
            <span style="background-color: #e8f5e8; padding: 2px 5px;">Low</span>
          </p>
        </div>
      </body>
      </html>
    `;

    return html;
  }
}

module.exports = new ShotlistController();