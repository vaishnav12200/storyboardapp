const Project = require('../models/Project');
const Scene = require('../models/Scene');
const { validationResult } = require('express-validator');

class ScriptController {
  // Get script for entire project
  async getProjectScript(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'screenplay' } = req.query;

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
        .sort({ sceneNumber: 1 })
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName');

      const script = this.formatScript(scenes, format, project);

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            title: project.title,
            type: project.type,
            genre: project.genre
          },
          script,
          format,
          totalScenes: scenes.length,
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

  // Get script for specific scene
  async getSceneScript(req, res) {
    try {
      const { sceneId } = req.params;
      const { format = 'screenplay' } = req.query;

      const scene = await Scene.findById(sceneId)
        .populate('project', 'title owner collaborators')
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName');

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

      const formattedScript = this.formatSceneScript(scene, format);

      res.status(200).json({
        success: true,
        data: {
          scene: {
            id: scene._id,
            sceneNumber: scene.sceneNumber,
            title: scene.title,
            project: scene.project.title
          },
          script: formattedScript,
          format,
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

  // Update scene script
  async updateSceneScript(req, res) {
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
      const { action, dialogue, notes } = req.body;

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

      // Update script content
      scene.script = {
        action: action || scene.script.action,
        dialogue: dialogue || scene.script.dialogue,
        notes: notes || scene.script.notes
      };

      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      await scene.populate('lastModifiedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: 'Scene script updated successfully',
        data: {
          sceneId: scene._id,
          script: scene.script,
          lastModified: scene.updatedAt,
          lastModifiedBy: scene.lastModifiedBy
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add dialogue to scene
  async addDialogue(req, res) {
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
      const { character, text, notes } = req.body;

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

      const dialogueEntry = {
        character: character.toUpperCase(),
        text,
        notes: notes || ''
      };

      if (!scene.script.dialogue) {
        scene.script.dialogue = [];
      }

      scene.script.dialogue.push(dialogueEntry);
      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(201).json({
        success: true,
        message: 'Dialogue added successfully',
        data: {
          sceneId: scene._id,
          dialogue: dialogueEntry,
          totalDialogues: scene.script.dialogue.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update specific dialogue
  async updateDialogue(req, res) {
    try {
      const { sceneId, dialogueIndex } = req.params;
      const { character, text, notes } = req.body;

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

      const index = parseInt(dialogueIndex);
      if (index < 0 || index >= scene.script.dialogue.length) {
        return res.status(404).json({
          success: false,
          message: 'Dialogue not found'
        });
      }

      // Update dialogue
      if (character) scene.script.dialogue[index].character = character.toUpperCase();
      if (text) scene.script.dialogue[index].text = text;
      if (notes !== undefined) scene.script.dialogue[index].notes = notes;

      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(200).json({
        success: true,
        message: 'Dialogue updated successfully',
        data: {
          sceneId: scene._id,
          dialogue: scene.script.dialogue[index],
          index
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete dialogue
  async deleteDialogue(req, res) {
    try {
      const { sceneId, dialogueIndex } = req.params;

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

      const index = parseInt(dialogueIndex);
      if (index < 0 || index >= scene.script.dialogue.length) {
        return res.status(404).json({
          success: false,
          message: 'Dialogue not found'
        });
      }

      scene.script.dialogue.splice(index, 1);
      scene.lastModifiedBy = req.user.userId;
      await scene.save();

      res.status(200).json({
        success: true,
        message: 'Dialogue deleted successfully',
        data: {
          sceneId: scene._id,
          remainingDialogues: scene.script.dialogue.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get character list from project
  async getCharacters(req, res) {
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
      const characterMap = new Map();

      // Extract characters from scenes
      scenes.forEach(scene => {
        // From dialogue
        if (scene.script.dialogue) {
          scene.script.dialogue.forEach(dialogue => {
            if (dialogue.character) {
              const character = dialogue.character.toUpperCase();
              if (!characterMap.has(character)) {
                characterMap.set(character, {
                  name: character,
                  appearances: 0,
                  scenes: []
                });
              }
              characterMap.get(character).appearances++;
              if (!characterMap.get(character).scenes.includes(scene.sceneNumber)) {
                characterMap.get(character).scenes.push(scene.sceneNumber);
              }
            }
          });
        }

        // From character list in scene
        if (scene.characters) {
          scene.characters.forEach(char => {
            const character = char.name.toUpperCase();
            if (!characterMap.has(character)) {
              characterMap.set(character, {
                name: character,
                appearances: 0,
                scenes: [],
                role: char.role
              });
            }
            if (!characterMap.get(character).scenes.includes(scene.sceneNumber)) {
              characterMap.get(character).scenes.push(scene.sceneNumber);
            }
            if (char.role) {
              characterMap.get(character).role = char.role;
            }
          });
        }
      });

      const characters = Array.from(characterMap.values())
        .sort((a, b) => b.appearances - a.appearances);

      res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            title: project.title
          },
          characters,
          totalCharacters: characters.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Auto-format script content
  async autoFormat(req, res) {
    try {
      const { sceneId } = req.params;
      const { content, targetFormat = 'screenplay' } = req.body;

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

      const formattedContent = this.parseAndFormatContent(content, targetFormat);

      res.status(200).json({
        success: true,
        message: 'Script formatted successfully',
        data: {
          original: content,
          formatted: formattedContent,
          format: targetFormat
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to format script
  formatScript(scenes, format, project) {
    let script = '';

    if (format === 'screenplay') {
      script += `TITLE: ${project.title.toUpperCase()}\n\n`;
      if (project.genre) {
        script += `GENRE: ${project.genre.toUpperCase()}\n\n`;
      }
      script += `FADE IN:\n\n`;

      scenes.forEach(scene => {
        script += this.formatSceneScript(scene, format) + '\n\n';
      });

      script += `FADE OUT.\n\nTHE END\n`;
    } else if (format === 'storyboard') {
      script += `# ${project.title}\n\n`;
      scenes.forEach((scene, index) => {
        script += `## Scene ${scene.sceneNumber}: ${scene.title}\n\n`;
        script += `**Location:** ${scene.location.type?.toUpperCase()} - ${scene.location.name} - ${scene.location.timeOfDay?.toUpperCase()}\n\n`;
        
        if (scene.description) {
          script += `${scene.description}\n\n`;
        }

        if (scene.storyboard.panels && scene.storyboard.panels.length > 0) {
          script += `### Storyboard Panels:\n\n`;
          scene.storyboard.panels.forEach(panel => {
            script += `**Panel ${panel.panelNumber}:** ${panel.description || ''}\n`;
            script += `- Shot Type: ${panel.shotType}\n`;
            script += `- Camera: ${panel.cameraMovement}\n`;
            script += `- Angle: ${panel.angle}\n\n`;
          });
        }

        if (scene.script.action) {
          script += `**Action:** ${scene.script.action}\n\n`;
        }

        if (scene.script.dialogue && scene.script.dialogue.length > 0) {
          script += `**Dialogue:**\n\n`;
          scene.script.dialogue.forEach(dialogue => {
            script += `${dialogue.character}: ${dialogue.text}\n`;
            if (dialogue.notes) {
              script += `*(${dialogue.notes})*\n`;
            }
            script += '\n';
          });
        }

        script += '---\n\n';
      });
    }

    return script;
  }

  // Helper method to format scene script
  formatSceneScript(scene, format) {
    let sceneScript = '';

    if (format === 'screenplay') {
      // Scene heading
      const intExt = scene.location.type?.toUpperCase() || 'INT';
      const location = scene.location.name?.toUpperCase() || 'LOCATION';
      const timeOfDay = scene.location.timeOfDay?.toUpperCase() || 'DAY';
      
      sceneScript += `${intExt}. ${location} - ${timeOfDay}\n\n`;

      // Action
      if (scene.script.action) {
        sceneScript += `${scene.script.action}\n\n`;
      }

      // Dialogue
      if (scene.script.dialogue && scene.script.dialogue.length > 0) {
        scene.script.dialogue.forEach(dialogue => {
          sceneScript += `${dialogue.character}\n`;
          sceneScript += `${dialogue.text}\n`;
          if (dialogue.notes) {
            sceneScript += `(${dialogue.notes})\n`;
          }
          sceneScript += '\n';
        });
      }
    }

    return sceneScript.trim();
  }

  // Helper method to parse and format content
  parseAndFormatContent(content, targetFormat) {
    // This is a simplified parser - in production, you'd want a more robust solution
    const lines = content.split('\n');
    let formatted = '';

    if (targetFormat === 'screenplay') {
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Detect scene headings (INT./EXT.)
        if (trimmedLine.match(/^(INT|EXT)[\.\s]/i)) {
          formatted += trimmedLine.toUpperCase() + '\n\n';
        }
        // Detect character names (ALL CAPS followed by dialogue)
        else if (trimmedLine.match(/^[A-Z\s]+$/) && trimmedLine.length > 0) {
          formatted += trimmedLine + '\n';
        }
        // Regular dialogue or action
        else if (trimmedLine.length > 0) {
          formatted += trimmedLine + '\n\n';
        }
      });
    }

    return formatted;
  }
}

module.exports = new ScriptController();