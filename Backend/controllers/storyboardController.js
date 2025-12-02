const Project = require('../models/Project');
const Scene = require('../models/Scene');
const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');

class StoryboardController {
  // Generate AI image for storyboard panel
  async generatePanelImage(req, res) {
    try {
      const { sceneId, panelId } = req.params;
      const {
        prompt,
        provider = 'auto',
        style = 'realistic-sketch',
        aspectRatio = '16:9',
        mood = 'neutral',
        enhancePrompt = true,
        saveAlternative = false
      } = req.body;
      
      // Auto-select provider based on user
      const actualProvider = provider === 'auto' ? aiService.selectBestProvider(req.currentUser) : provider;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const panel = scene.storyboard.panels.id(panelId);
      if (!panel) {
        return res.status(404).json({
          success: false,
          message: 'Panel not found'
        });
      }

      // Generate AI image
      
      console.log('🎨 Starting AI image generation for panel:', panelId);
      console.log('📝 Prompt:', prompt);
      console.log('⚙️  Provider:', provider);
      console.log('🎭 Style:', style);
      
      const generationOptions = {
        provider: actualProvider,
        style,
        shotType: panel.shotType,
        cameraMovement: panel.cameraMovement,
        aspectRatio,
        mood,
        location: scene.location && scene.location.name ? scene.location : null,
        timeOfDay: scene.location?.timeOfDay || null,
        characters: scene.characters || [],
        enhancePrompt
      };

      console.log('🔧 Generation options:', JSON.stringify(generationOptions, null, 2));

      const result = await aiService.generateStoryboardImage(prompt, generationOptions, req.currentUser);

      console.log('📊 AI Service Result:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('❌ AI generation failed:', result.message);
        return res.status(500).json({
          success: false,
          message: `AI generation failed: ${result.message}`,
          provider: result.provider,
          error: result.error || 'Unknown error'
        });
      }

      // Validate that we got a proper image URL
      if (!result.data.imageUrl) {
        console.error('❌ No image URL returned from AI service');
        return res.status(500).json({
          success: false,
          message: 'AI generation completed but no image URL was returned',
          provider: result.data.provider
        });
      }

      console.log('🖼️ Generated image URL:', result.data.imageUrl);

      // Save previous generation if keeping alternatives
      if (saveAlternative && panel.image && panel.imageSource?.type === 'ai-generated') {
        if (!panel.imageSource.aiGeneration.previousGenerations) {
          panel.imageSource.aiGeneration.previousGenerations = [];
        }
        
        panel.imageSource.aiGeneration.previousGenerations.push({
          imageUrl: panel.image,
          prompt: panel.imageSource.aiGeneration.enhancedPrompt,
          generatedAt: panel.imageSource.aiGeneration.generatedAt,
          settings: panel.imageSource.aiGeneration.settings
        });
      }

      // Update panel with AI-generated image
      panel.image = result.data.imageUrl;
      panel.imageSource = {
        type: 'ai-generated',
        aiGeneration: {
          provider: result.data.provider,
          originalPrompt: result.data.originalPrompt,
          enhancedPrompt: result.data.prompt,
          generationId: result.data.generationId,
          originalImageUrl: result.data.imageUrl,
          settings: {
            style,
            aspectRatio,
            mood,
            shotType: panel.shotType,
            cameraMovement: panel.cameraMovement
          },
          generatedAt: result.data.generatedAt,
          revisedPrompt: result.data.revisedPrompt || null,
          previousGenerations: panel.imageSource?.aiGeneration?.previousGenerations || []
        }
      };

      panel.lastModified = new Date();
      scene.lastModifiedBy = req.user.userId;
      
      console.log('💾 Saving panel with original image URL:', result.data.imageUrl);
      await scene.save();
      console.log('✅ Panel saved successfully');

      await scene.populate('lastModifiedBy', 'firstName lastName email');

      res.status(200).json({
        success: true,
        data: {
          imageUrl: result.data.imageUrl,
          panel: panel,
          generationDetails: result.data,
          sceneId: scene._id
        }
      });
    } catch (error) {
      console.error('❌ AI Generation Error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.stack
      });
    }
  }

  // Regenerate panel image with new prompt/settings
  async regeneratePanelImage(req, res) {
    try {
      const { sceneId, panelId } = req.params;
      const { 
        prompt, 
        provider, 
        style, 
        aspectRatio, 
        mood,
        keepPrevious = true 
      } = req.body;

      // Use the generatePanelImage method with saveAlternative = keepPrevious
      req.body.saveAlternative = keepPrevious;
      
      return await this.generatePanelImage(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get AI generation history for a panel
  async getPanelGenerationHistory(req, res) {
    try {
      const { sceneId, panelId } = req.params;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has read permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const panel = scene.storyboard.panels.id(panelId);
      if (!panel) {
        return res.status(404).json({
          success: false,
          message: 'Panel not found'
        });
      }

      const history = {
        currentImage: {
          url: panel.image,
          source: panel.imageSource?.type || 'uploaded',
          generatedAt: panel.imageSource?.aiGeneration?.generatedAt || panel.imageSource?.uploadDetails?.uploadedAt,
          prompt: panel.imageSource?.aiGeneration?.enhancedPrompt || null
        },
        previousGenerations: panel.imageSource?.aiGeneration?.previousGenerations || [],
        totalGenerations: (panel.imageSource?.aiGeneration?.previousGenerations?.length || 0) + 
                         (panel.imageSource?.type === 'ai-generated' ? 1 : 0)
      };

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate script suggestions using AI
  async generateScriptSuggestions(req, res) {
    try {
      const { sceneId } = req.params;
      const { 
        type = 'both', // 'dialogue', 'action', 'both'
        tone = 'neutral',
        genre = 'drama'
      } = req.body;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const aiService = require('../services/aiService');

      const sceneDescription = `
        Scene ${scene.sceneNumber}: ${scene.title}
        Location: ${scene.location?.type} - ${scene.location?.name} - ${scene.location?.timeOfDay}
        Description: ${scene.description || 'No description provided'}
        Existing Action: ${scene.script?.action || 'None'}
      `;

      const result = await aiService.generateScriptSuggestions(sceneDescription, {
        type,
        genre: scene.project.genre || genre,
        characters: scene.characters,
        tone
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: `Script generation failed: ${result.message}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Script suggestions generated successfully',
        data: {
          suggestions: result.data.suggestion,
          type: result.data.type,
          scene: {
            id: scene._id,
            sceneNumber: scene.sceneNumber,
            title: scene.title
          },
          generatedAt: result.data.generatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate storyboard analysis and suggestions
  async analyzeStoryboard(req, res) {
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

      const scenes = await Scene.find({ project: projectId }).sort({ sceneNumber: 1 });

      const aiService = require('../services/aiService');
      const analysisResult = await aiService.suggestStoryboardImprovements(scenes);

      if (!analysisResult.success) {
        return res.status(500).json({
          success: false,
          message: `Analysis failed: ${analysisResult.message}`
        });
      }

      // Update scenes with analysis data
      const shotVariety = this.calculateShotVariety(scenes);
      const pacingAnalysis = this.calculatePacingAnalysis(scenes);

      // Store analysis in each scene
      for (const scene of scenes) {
        scene.storyboard.aiAnalysis = {
          lastAnalyzedAt: new Date(),
          suggestions: analysisResult.data.suggestions.split('\n').filter(s => s.trim()),
          shotVariety,
          pacing: pacingAnalysis,
          visualFlow: {
            flowScore: this.calculateVisualFlowScore(scenes, scene),
            transitions: [],
            recommendations: []
          }
        };
        await scene.save();
      }

      res.status(200).json({
        success: true,
        message: 'Storyboard analysis completed',
        data: {
          analysis: analysisResult.data,
          projectStats: {
            totalScenes: scenes.length,
            totalPanels: scenes.reduce((sum, scene) => sum + (scene.storyboard?.totalPanels || 0), 0),
            shotVariety,
            pacing: pacingAnalysis
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

  // Get available AI providers
  async getAIProviders(req, res) {
    try {
      const aiService = require('../services/aiService');
      const providers = aiService.getAvailableProviders();

      res.status(200).json({
        success: true,
        data: {
          providers,
          totalProviders: providers.length,
          defaultProvider: providers[0]?.name || null
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Bulk generate images for multiple panels
  async bulkGeneratePanelImages(req, res) {
    try {
      const { sceneId } = req.params;
      const { 
        panels, // Array of { panelId, prompt, settings }
        globalSettings = {},
        provider = 'openai'
      } = req.body;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const aiService = require('../services/aiService');
      const results = [];

      // Generate images for each panel
      for (const panelData of panels) {
        const panel = scene.storyboard.panels.id(panelData.panelId);
        if (!panel) {
          results.push({
            panelId: panelData.panelId,
            success: false,
            message: 'Panel not found'
          });
          continue;
        }

        const generationOptions = {
          provider,
          ...globalSettings,
          ...panelData.settings,
          shotType: panel.shotType,
          cameraMovement: panel.cameraMovement,
          location: scene.location,
          timeOfDay: scene.location?.timeOfDay,
          characters: scene.characters
        };

        try {
          const result = await aiService.generateStoryboardImage(panelData.prompt, generationOptions);
          
          if (result.success) {
            // Update panel
            panel.image = result.data.imageUrl;
            panel.imageSource = {
              type: 'ai-generated',
              aiGeneration: {
                provider: result.data.provider,
                originalPrompt: result.data.originalPrompt,
                enhancedPrompt: result.data.prompt,
                generationId: result.data.generationId,
                settings: generationOptions,
                generatedAt: result.data.generatedAt
              }
            };
            panel.lastModified = new Date();

            results.push({
              panelId: panelData.panelId,
              success: true,
              imageUrl: result.data.imageUrl,
              generationId: result.data.generationId
            });
          } else {
            results.push({
              panelId: panelData.panelId,
              success: false,
              message: result.message
            });
          }
        } catch (error) {
          results.push({
            panelId: panelData.panelId,
            success: false,
            message: error.message
          });
        }

        // Add delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      const successCount = results.filter(r => r.success).length;
      
      res.status(200).json({
        success: true,
        message: `Bulk generation completed: ${successCount}/${results.length} panels generated successfully`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: results.length - successCount
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

  // Helper method to calculate shot variety
  calculateShotVariety(scenes) {
    const shotCounts = {
      wideShots: 0,
      mediumShots: 0,
      closeUps: 0
    };

    let totalPanels = 0;

    scenes.forEach(scene => {
      if (scene.storyboard?.panels) {
        scene.storyboard.panels.forEach(panel => {
          totalPanels++;
          switch (panel.shotType) {
            case 'wide-shot':
            case 'establishing':
              shotCounts.wideShots++;
              break;
            case 'medium-shot':
            case 'over-shoulder':
              shotCounts.mediumShots++;
              break;
            case 'close-up':
            case 'extreme-close-up':
              shotCounts.closeUps++;
              break;
          }
        });
      }
    });

    // Calculate variety score (0-100)
    const idealDistribution = { wide: 0.3, medium: 0.5, closeUp: 0.2 };
    const actualDistribution = {
      wide: shotCounts.wideShots / totalPanels,
      medium: shotCounts.mediumShots / totalPanels,
      closeUp: shotCounts.closeUps / totalPanels
    };

    const varietyScore = Math.max(0, 100 - (
      Math.abs(idealDistribution.wide - actualDistribution.wide) * 100 +
      Math.abs(idealDistribution.medium - actualDistribution.medium) * 100 +
      Math.abs(idealDistribution.closeUp - actualDistribution.closeUp) * 100
    ));

    return {
      ...shotCounts,
      varietyScore: Math.round(varietyScore)
    };
  }

  // Helper method to calculate pacing analysis
  calculatePacingAnalysis(scenes) {
    const totalPanels = scenes.reduce((sum, scene) => sum + (scene.storyboard?.totalPanels || 0), 0);
    const averagePanelsPerScene = scenes.length > 0 ? totalPanels / scenes.length : 0;

    // Ideal pacing: 3-6 panels per scene for most content
    const idealRange = { min: 3, max: 6 };
    let pacingScore = 100;

    if (averagePanelsPerScene < idealRange.min) {
      pacingScore = (averagePanelsPerScene / idealRange.min) * 100;
    } else if (averagePanelsPerScene > idealRange.max) {
      pacingScore = Math.max(50, 100 - ((averagePanelsPerScene - idealRange.max) / idealRange.max) * 50);
    }

    const recommendations = [];
    if (averagePanelsPerScene < 2) {
      recommendations.push('Consider adding more panels per scene for better visual storytelling');
    } else if (averagePanelsPerScene > 8) {
      recommendations.push('Some scenes might be over-detailed. Consider consolidating panels');
    }

    return {
      averagePanelsPerScene: Math.round(averagePanelsPerScene * 10) / 10,
      pacingScore: Math.round(pacingScore),
      recommendations
    };
  }

  // Helper method to calculate visual flow score
  calculateVisualFlowScore(allScenes, currentScene) {
    // Simple flow score based on shot progression
    const currentIndex = allScenes.findIndex(s => s._id.equals(currentScene._id));
    if (currentIndex === -1) return 50;

    let flowScore = 50;

    // Check transitions between scenes
    if (currentIndex > 0) {
      const prevScene = allScenes[currentIndex - 1];
      // Add logic to check shot transitions
      flowScore += 10;
    }

    if (currentIndex < allScenes.length - 1) {
      const nextScene = allScenes[currentIndex + 1];
      // Add logic to check shot transitions
      flowScore += 10;
    }

    return Math.min(100, flowScore);
  }

  // Create new project
  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      console.log('📝 Creating project with data:', {
        director: req.body.director,
        producer: req.body.producer,
        genre: req.body.genre,
        title: req.body.title
      });

      // Prepare project data with proper structure
      const projectData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'short-film',
        genre: req.body.genre,
        director: req.body.director,
        producer: req.body.producer,
        status: req.body.status || 'planning',
        owner: req.user.userId,
        createdBy: req.user.userId,
        lastModifiedBy: req.user.userId
      };

      // Handle budget conversion (frontend sends number, backend expects object)
      if (req.body.budget !== undefined && req.body.budget !== null) {
        projectData.budget = {
          total: Number(req.body.budget),
          currency: 'USD'
        };
      }

      // Handle timeline dates
      if (req.body.startDate || req.body.endDate) {
        projectData.timeline = {
          startDate: req.body.startDate,
          endDate: req.body.endDate
        };
      }

      const project = new Project(projectData);
      await project.save();

      await project.populate('owner', 'firstName lastName email profileImage');

      console.log('✅ Project created:', {
        id: project._id,
        director: project.director,
        producer: project.producer,
        genre: project.genre
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      console.error('❌ Error creating project:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all projects for authenticated user
  async getProjects(req, res) {
    try {
      const { page = 1, limit = 10, status, type, search } = req.query;
      const skip = (page - 1) * limit;

      const query = {
        $or: [
          { owner: req.user.userId },
          { 'collaborators.user': req.user.userId }
        ],
        isArchived: false
      };

      if (status) query.status = status;
      if (type) query.type = type;
      if (search) {
        query.$text = { $search: search };
      }

      const projects = await Project.find(query)
        .populate('owner', 'firstName lastName email profileImage')
        .populate('collaborators.user', 'firstName lastName email profileImage')
        .sort({ lastModified: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Project.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          projects,
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

  // Get single project by ID
  async getProject(req, res) {
    try {
      const { projectId } = req.params;
      
      const project = await Project.findById(projectId)
        .populate('owner', 'firstName lastName email profileImage')
        .populate('collaborators.user', 'firstName lastName email profileImage')
        .populate('scenes')
        .populate('schedules')
        .populate('budgets');

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has access to this project
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update project
  async updateProject(req, res) {
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
      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.userId
      };

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

      Object.assign(project, updateData);
      await project.save();

      await project.populate('owner', 'firstName lastName email profileImage');
      await project.populate('collaborators.user', 'firstName lastName email profileImage');

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete project
  async deleteProject(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Delete all related scenes
      await Scene.deleteMany({ project: projectId });

      // Delete the project
      await Project.findByIdAndDelete(projectId);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Archive project
  async archiveProject(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has admin permission
      const hasAccess = project.hasPermission(req.user.userId, 'admin');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      project.isArchived = true;
      project.archivedAt = new Date();
      project.lastModifiedBy = req.user.userId;
      await project.save();

      res.status(200).json({
        success: true,
        message: 'Project archived successfully',
        data: project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add collaborator to project
  async addCollaborator(req, res) {
    try {
      const { projectId } = req.params;
      const { userId, role, permissions } = req.body;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has admin permission
      const hasAccess = project.hasPermission(req.user.userId, 'admin');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if user is already a collaborator
      const existingCollaborator = project.collaborators.find(
        collab => collab.user.toString() === userId
      );

      if (existingCollaborator) {
        return res.status(400).json({
          success: false,
          message: 'User is already a collaborator on this project'
        });
      }

      project.collaborators.push({
        user: userId,
        role: role || 'crew',
        permissions: permissions || ['read']
      });

      await project.save();
      await project.populate('collaborators.user', 'firstName lastName email profileImage');

      res.status(200).json({
        success: true,
        message: 'Collaborator added successfully',
        data: project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Remove collaborator from project
  async removeCollaborator(req, res) {
    try {
      const { projectId, userId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has admin permission
      const hasAccess = project.hasPermission(req.user.userId, 'admin');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      project.collaborators = project.collaborators.filter(
        collab => collab.user.toString() !== userId
      );

      await project.save();

      res.status(200).json({
        success: true,
        message: 'Collaborator removed successfully',
        data: project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create scene in project
  async createScene(req, res) {
    try {
      console.log('🎬 CREATE SCENE API CALLED');
      console.log('📂 Project ID:', req.params.projectId);
      console.log('👤 User ID:', req.user?.userId);
      console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
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

      // Get next scene number
      const nextSceneNumber = await Scene.getNextSceneNumber(projectId);

      const sceneData = {
        ...req.body,
        project: projectId,
        sceneNumber: req.body.sceneNumber || nextSceneNumber,
        createdBy: req.user.userId,
        lastModifiedBy: req.user.userId
      };

      const scene = new Scene(sceneData);
      await scene.save();

      // Update project metadata
      project.metadata.totalScenes = await Scene.countDocuments({ project: projectId });
      await project.save();

      await scene.populate('createdBy', 'firstName lastName email');

      res.status(201).json({
        success: true,
        message: 'Scene created successfully',
        data: scene
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all scenes for a project
  async getScenes(req, res) {
    try {
      console.log('🎬 GET SCENES API CALLED');
      console.log('📂 Project ID:', req.params.projectId);
      console.log('👤 User ID:', req.user?.userId);
      console.log('🔍 Query params:', req.query);
      
      const { projectId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
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

      const scenes = await Scene.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName email')
        .sort({ sceneNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Scene.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          scenes,
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

  // Get single scene
  async getScene(req, res) {
    try {
      const { sceneId } = req.params;

      const scene = await Scene.findById(sceneId)
        .populate('project', 'title owner collaborators')
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName email');

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

      res.status(200).json({
        success: true,
        data: scene
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update scene
  async updateScene(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sceneId } = req.params;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
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

      Object.assign(scene, updateData);
      await scene.save();

      await scene.populate('createdBy', 'firstName lastName email');
      await scene.populate('lastModifiedBy', 'firstName lastName email');

      res.status(200).json({
        success: true,
        message: 'Scene updated successfully',
        data: scene
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete scene
  async deleteScene(req, res) {
    try {
      const { sceneId } = req.params;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await Scene.findByIdAndDelete(sceneId);

      // Update project metadata
      const project = await Project.findById(scene.project._id);
      project.metadata.totalScenes = await Scene.countDocuments({ project: scene.project._id });
      await project.save();

      res.status(200).json({
        success: true,
        message: 'Scene deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Duplicate scene
  async duplicateScene(req, res) {
    try {
      const { sceneId } = req.params;

      const originalScene = await Scene.findById(sceneId).populate('project');
      if (!originalScene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = originalScene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const duplicatedScene = originalScene.duplicate();
      duplicatedScene.sceneNumber = await Scene.getNextSceneNumber(originalScene.project._id);
      duplicatedScene.createdBy = req.user.userId;
      duplicatedScene.lastModifiedBy = req.user.userId;

      await duplicatedScene.save();

      // Update project metadata
      const project = await Project.findById(originalScene.project._id);
      project.metadata.totalScenes = await Scene.countDocuments({ project: originalScene.project._id });
      await project.save();

      await duplicatedScene.populate('createdBy', 'firstName lastName email');

      res.status(201).json({
        success: true,
        message: 'Scene duplicated successfully',
        data: duplicatedScene
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reorder scenes
  async reorderScenes(req, res) {
    try {
      const { projectId } = req.params;
      const { sceneOrders } = req.body; // Array of { sceneId, newSceneNumber }

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

      // Update scene numbers
      for (const order of sceneOrders) {
        await Scene.findByIdAndUpdate(
          order.sceneId,
          { 
            sceneNumber: order.newSceneNumber,
            lastModifiedBy: req.user.userId
          }
        );
      }

      res.status(200).json({
        success: true,
        message: 'Scenes reordered successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add storyboard panel to scene
  async addStoryboardPanel(req, res) {
    try {
      console.log('🎨 ADD STORYBOARD PANEL API CALLED');
      console.log('🎬 Scene ID:', req.params.sceneId);
      console.log('👤 User ID:', req.user?.userId);
      console.log('📝 Panel data:', JSON.stringify(req.body, null, 2));
      
      const { sceneId } = req.params;
      const panelData = req.body;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get next panel number
      const nextPanelNumber = scene.storyboard.panels.length + 1;

      const panel = {
        ...panelData,
        panelNumber: panelData.panelNumber || nextPanelNumber
      };

      scene.storyboard.panels.push(panel);
      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(201).json({
        success: true,
        message: 'Storyboard panel added successfully',
        data: scene.storyboard.panels[scene.storyboard.panels.length - 1]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update storyboard panel
  async updateStoryboardPanel(req, res) {
    try {
      const { sceneId, panelId } = req.params;
      const updateData = req.body;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has write permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const panel = scene.storyboard.panels.id(panelId);
      if (!panel) {
        return res.status(404).json({
          success: false,
          message: 'Storyboard panel not found'
        });
      }

      Object.assign(panel, updateData);
      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(200).json({
        success: true,
        message: 'Storyboard panel updated successfully',
        data: panel
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete storyboard panel
  async deleteStoryboardPanel(req, res) {
    try {
      const { sceneId, panelId } = req.params;

      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        return res.status(404).json({
          success: false,
          message: 'Scene not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = scene.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      scene.storyboard.panels.id(panelId).remove();
      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(200).json({
        success: true,
        message: 'Storyboard panel deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get project statistics
  async getProjectStats(req, res) {
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

      const stats = await Scene.aggregate([
        { $match: { project: project._id } },
        {
          $group: {
            _id: null,
            totalScenes: { $sum: 1 },
            totalPanels: { $sum: '$storyboard.totalPanels' },
            completedScenes: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            draftScenes: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
            },
            inProgressScenes: {
              $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
            },
            averagePanelsPerScene: { $avg: '$storyboard.totalPanels' }
          }
        }
      ]);

      const projectStats = stats[0] || {
        totalScenes: 0,
        totalPanels: 0,
        completedScenes: 0,
        draftScenes: 0,
        inProgressScenes: 0,
        averagePanelsPerScene: 0
      };

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            title: project.title,
            status: project.status,
            type: project.type
          },
          stats: projectStats
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

module.exports = new StoryboardController();