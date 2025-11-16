const Project = require('../models/Project');
const Scene = require('../models/Scene');
const Schedule = require('../models/Schedule');
const Budget = require('../models/Budget');
const pdfService = require('../services/pdfService');
const storageService = require('../services/storageService');

class ExportController {
  // Export storyboard as PDF
  async exportStoryboard(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'pdf' } = req.query;

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
        .populate('createdBy', 'firstName lastName');

      if (format === 'pdf') {
        const doc = await pdfService.generateStoryboardPDF(project, scenes);
        const buffer = await pdfService.savePDFToBuffer(doc);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-storyboard.pdf"`);
        res.send(buffer);
      } else if (format === 'html') {
        const html = pdfService.createStoryboardHTML(project, scenes);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use pdf or html'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export script as PDF
  async exportScript(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'pdf' } = req.query;

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

      if (format === 'pdf') {
        const doc = await pdfService.generateScriptPDF(project, scenes);
        const buffer = await pdfService.savePDFToBuffer(doc);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-script.pdf"`);
        res.send(buffer);
      } else if (format === 'txt') {
        const script = this.generateScriptText(project, scenes);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-script.txt"`);
        res.send(script);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use pdf or txt'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export schedule as PDF
  async exportSchedule(req, res) {
    try {
      const { projectId } = req.params;
      const { startDate, endDate, format = 'pdf' } = req.query;

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
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const schedules = await Schedule.find(query)
        .populate('scenes.scene', 'sceneNumber title')
        .populate('crew.member', 'firstName lastName')
        .sort({ date: 1, 'timeSlot.startTime': 1 });

      if (format === 'pdf') {
        const doc = await pdfService.generateSchedulePDF(project, schedules);
        const buffer = await pdfService.savePDFToBuffer(doc);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-schedule.pdf"`);
        res.send(buffer);
      } else if (format === 'csv') {
        const csv = this.generateScheduleCSV(schedules);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-schedule.csv"`);
        res.send(csv);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use pdf or csv'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export budget as PDF
  async exportBudget(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'pdf' } = req.query;

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

      const budget = await Budget.findOne({ project: projectId, status: 'active' })
        .populate('expenses.createdBy', 'firstName lastName');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'No active budget found for this project'
        });
      }

      if (format === 'pdf') {
        const doc = await pdfService.generateBudgetPDF(budget, budget.expenses);
        const buffer = await pdfService.savePDFToBuffer(doc);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-budget.pdf"`);
        res.send(buffer);
      } else if (format === 'csv') {
        const csv = this.generateBudgetCSV(budget);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-budget.csv"`);
        res.send(csv);
      } else if (format === 'excel') {
        const excel = this.generateBudgetExcel(budget);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${project.title}-budget.xlsx"`);
        res.send(excel);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use pdf, csv, or excel'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Export complete project package
  async exportProject(req, res) {
    try {
      const { projectId } = req.params;
      const { includeAssets = false } = req.query;

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

      // Get all project data
      const [scenes, schedules, budget] = await Promise.all([
        Scene.find({ project: projectId }).sort({ sceneNumber: 1 }),
        Schedule.find({ project: projectId }).sort({ date: 1 }),
        Budget.findOne({ project: projectId, status: 'active' })
      ]);

      // Create export package
      const exportData = {
        project: {
          ...project.toObject(),
          exportedAt: new Date(),
          exportedBy: req.user.userId
        },
        scenes: scenes.map(scene => scene.toObject()),
        schedules: schedules.map(schedule => schedule.toObject()),
        budget: budget?.toObject() || null,
        metadata: {
          version: '1.0',
          format: 'JSON',
          totalScenes: scenes.length,
          totalSchedules: schedules.length,
          includeAssets
        }
      };

      // If including assets, add file references
      if (includeAssets) {
        exportData.assets = this.collectProjectAssets(scenes);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${project.title}-export.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Import project from exported data
  async importProject(req, res) {
    try {
      const { projectData } = req.body;

      if (!projectData || !projectData.project) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project data'
        });
      }

      // Create new project
      const newProjectData = {
        ...projectData.project,
        _id: undefined,
        owner: req.user.userId,
        createdBy: req.user.userId,
        title: `${projectData.project.title} (Imported)`,
        collaborators: [], // Reset collaborators
        createdAt: undefined,
        updatedAt: undefined
      };

      const project = new Project(newProjectData);
      await project.save();

      // Import scenes if available
      if (projectData.scenes && projectData.scenes.length > 0) {
        const scenePromises = projectData.scenes.map(sceneData => {
          const newScene = new Scene({
            ...sceneData,
            _id: undefined,
            project: project._id,
            createdBy: req.user.userId,
            createdAt: undefined,
            updatedAt: undefined
          });
          return newScene.save();
        });

        await Promise.all(scenePromises);
      }

      // Import budget if available
      if (projectData.budget) {
        const newBudget = new Budget({
          ...projectData.budget,
          _id: undefined,
          project: project._id,
          createdBy: req.user.userId,
          createdAt: undefined,
          updatedAt: undefined
        });
        await newBudget.save();
      }

      res.status(201).json({
        success: true,
        message: 'Project imported successfully',
        data: {
          project: project,
          importedScenes: projectData.scenes?.length || 0,
          importedBudget: !!projectData.budget
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to generate script text
  generateScriptText(project, scenes) {
    let script = `${project.title.toUpperCase()}\n\n`;
    
    if (project.genre) {
      script += `Genre: ${project.genre}\n\n`;
    }

    script += 'FADE IN:\n\n';

    scenes.forEach(scene => {
      // Scene heading
      const heading = `${scene.location?.type?.toUpperCase() || 'INT'}. ${scene.location?.name?.toUpperCase() || 'LOCATION'} - ${scene.location?.timeOfDay?.toUpperCase() || 'DAY'}`;
      script += `${heading}\n\n`;

      // Action
      if (scene.script?.action) {
        script += `${scene.script.action}\n\n`;
      }

      // Dialogue
      if (scene.script?.dialogue && scene.script.dialogue.length > 0) {
        scene.script.dialogue.forEach(dialogue => {
          script += `${dialogue.character}\n`;
          script += `${dialogue.text}\n`;
          if (dialogue.notes) {
            script += `(${dialogue.notes})\n`;
          }
          script += '\n';
        });
      }

      script += '\n';
    });

    script += 'FADE OUT.\n\nTHE END\n';
    return script;
  }

  // Helper method to generate schedule CSV
  generateScheduleCSV(schedules) {
    let csv = 'Date,Start Time,End Time,Title,Location,Status,Scenes,Crew Count\n';
    
    schedules.forEach(schedule => {
      const date = schedule.date.toISOString().split('T')[0];
      const sceneNumbers = schedule.scenes.map(s => s.scene?.sceneNumber || 'N/A').join(';');
      const location = schedule.location?.name || '';
      
      csv += `"${date}","${schedule.timeSlot.startTime}","${schedule.timeSlot.endTime}","${schedule.title}","${location}","${schedule.status}","${sceneNumbers}",${schedule.crew.length}\n`;
    });
    
    return csv;
  }

  // Helper method to generate budget CSV
  generateBudgetCSV(budget) {
    let csv = 'Date,Description,Category,Amount,Status,Vendor,Payment Method,Invoice Number\n';
    
    budget.expenses.forEach(expense => {
      const date = expense.date.toISOString().split('T')[0];
      const vendor = expense.vendor?.name || '';
      
      csv += `"${date}","${expense.description}","${expense.category}",${expense.amount},"${expense.status}","${vendor}","${expense.paymentMethod}","${expense.invoiceNumber || ''}"\n`;
    });
    
    return csv;
  }

  // Helper method to generate budget Excel (simplified)
  generateBudgetExcel(budget) {
    // This is a simplified implementation
    // In production, you'd use a library like ExcelJS or xlsx
    const data = {
      summary: budget.summary,
      categories: budget.categories,
      expenses: budget.expenses.map(expense => ({
        date: expense.date.toISOString().split('T')[0],
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        status: expense.status,
        vendor: expense.vendor?.name || '',
        paymentMethod: expense.paymentMethod
      }))
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Helper method to collect project assets
  collectProjectAssets(scenes) {
    const assets = {
      storyboardImages: [],
      attachments: [],
      totalFiles: 0,
      totalSize: 0
    };

    scenes.forEach(scene => {
      // Collect storyboard panel images
      if (scene.storyboard?.panels) {
        scene.storyboard.panels.forEach(panel => {
          if (panel.image) {
            assets.storyboardImages.push({
              sceneNumber: scene.sceneNumber,
              panelNumber: panel.panelNumber,
              url: panel.image
            });
          }
        });
      }

      // Collect attachments
      if (scene.attachments) {
        scene.attachments.forEach(attachment => {
          assets.attachments.push({
            sceneNumber: scene.sceneNumber,
            name: attachment.name,
            url: attachment.url,
            type: attachment.type,
            size: attachment.size
          });
          
          if (attachment.size) {
            assets.totalSize += attachment.size;
          }
        });
      }
    });

    assets.totalFiles = assets.storyboardImages.length + assets.attachments.length;
    return assets;
  }

  // Generate presentation from storyboard
  async exportPresentation(req, res) {
    try {
      const { projectId } = req.params;
      const { format = 'html' } = req.query;

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

      if (format === 'html') {
        const html = this.generatePresentationHTML(project, scenes);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Only HTML format is supported for presentations'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate presentation HTML
  generatePresentationHTML(project, scenes) {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${project.title} - Storyboard Presentation</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .slide { 
            width: 100vw; 
            height: 100vh; 
            padding: 40px; 
            box-sizing: border-box;
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .slide.active { display: flex; }
          .slide h1 { font-size: 3em; margin-bottom: 20px; text-align: center; }
          .slide h2 { font-size: 2em; margin-bottom: 30px; text-align: center; }
          .scene-content { 
            display: flex; 
            width: 100%; 
            max-width: 1200px; 
            gap: 40px;
            align-items: center;
          }
          .storyboard-panel {
            flex: 1;
            text-align: center;
          }
          .storyboard-image {
            width: 100%;
            max-width: 500px;
            height: 300px;
            background: rgba(255,255,255,0.1);
            border: 2px dashed rgba(255,255,255,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            border-radius: 10px;
          }
          .scene-details {
            flex: 1;
          }
          .scene-title {
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            padding-bottom: 10px;
          }
          .scene-info {
            font-size: 1.2em;
            margin-bottom: 15px;
            opacity: 0.9;
          }
          .navigation {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            gap: 15px;
          }
          .nav-btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .nav-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
          }
          .slide-counter {
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: rgba(0,0,0,0.3);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <!-- Title Slide -->
        <div class="slide active">
          <h1>${project.title}</h1>
          <h2>Storyboard Presentation</h2>
          <p style="font-size: 1.2em; opacity: 0.8;">
            ${project.description || ''}
          </p>
          <p style="margin-top: 40px;">
            Total Scenes: ${scenes.length}
          </p>
        </div>
    `;

    // Scene slides
    scenes.forEach((scene, index) => {
      html += `
        <div class="slide">
          <div class="scene-content">
            <div class="storyboard-panel">
      `;

      // If scene has storyboard panels, show the first one
      if (scene.storyboard?.panels && scene.storyboard.panels.length > 0) {
        const firstPanel = scene.storyboard.panels[0];
        html += `
          <div class="storyboard-image">
            ${firstPanel.image ? 
              `<img src="${firstPanel.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
              'Storyboard Image'}
          </div>
          <p><strong>Shot:</strong> ${firstPanel.shotType || 'Medium Shot'}</p>
          <p><strong>Movement:</strong> ${firstPanel.cameraMovement || 'Static'}</p>
        `;
      } else {
        html += `
          <div class="storyboard-image">
            No Storyboard Image
          </div>
        `;
      }

      html += `
            </div>
            <div class="scene-details">
              <div class="scene-title">Scene ${scene.sceneNumber}: ${scene.title}</div>
              <div class="scene-info">
                <strong>Location:</strong> 
                ${scene.location?.type?.toUpperCase() || 'INT'} - 
                ${scene.location?.name || 'LOCATION'} - 
                ${scene.location?.timeOfDay?.toUpperCase() || 'DAY'}
              </div>
      `;

      if (scene.description) {
        html += `<div class="scene-info">${scene.description}</div>`;
      }

      if (scene.script?.action) {
        html += `<div class="scene-info"><strong>Action:</strong> ${scene.script.action}</div>`;
      }

      if (scene.script?.dialogue && scene.script.dialogue.length > 0) {
        html += `<div class="scene-info"><strong>Key Dialogue:</strong></div>`;
        scene.script.dialogue.slice(0, 2).forEach(dialogue => {
          html += `<div class="scene-info" style="margin-left: 20px;"><strong>${dialogue.character}:</strong> "${dialogue.text}"</div>`;
        });
      }

      html += `
            </div>
          </div>
        </div>
      `;
    });

    html += `
        <!-- Navigation -->
        <div class="navigation">
          <button class="nav-btn" onclick="previousSlide()">← Previous</button>
          <button class="nav-btn" onclick="nextSlide()">Next →</button>
        </div>
        
        <div class="slide-counter">
          <span id="current-slide">1</span> / <span id="total-slides">${scenes.length + 1}</span>
        </div>

        <script>
          let currentSlide = 0;
          const slides = document.querySelectorAll('.slide');
          const totalSlides = slides.length;

          function showSlide(n) {
            slides[currentSlide].classList.remove('active');
            currentSlide = (n + totalSlides) % totalSlides;
            slides[currentSlide].classList.add('active');
            document.getElementById('current-slide').textContent = currentSlide + 1;
          }

          function nextSlide() {
            showSlide(currentSlide + 1);
          }

          function previousSlide() {
            showSlide(currentSlide - 1);
          }

          // Keyboard navigation
          document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
              nextSlide();
            } else if (e.key === 'ArrowLeft') {
              previousSlide();
            }
          });

          document.getElementById('total-slides').textContent = totalSlides;
        </script>
      </body>
      </html>
    `;

    return html;
  }

  // Export project analytics
  async exportAnalytics(req, res) {
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

      // Gather analytics data
      const [scenes, schedules, budget] = await Promise.all([
        Scene.find({ project: projectId }),
        Schedule.find({ project: projectId }),
        Budget.findOne({ project: projectId, status: 'active' })
      ]);

      const analytics = {
        project: {
          id: project._id,
          title: project.title,
          status: project.status,
          type: project.type,
          createdAt: project.createdAt
        },
        scenes: {
          total: scenes.length,
          byStatus: this.groupByField(scenes, 'status'),
          totalPanels: scenes.reduce((sum, scene) => sum + (scene.storyboard?.totalPanels || 0), 0),
          averagePanelsPerScene: scenes.length > 0 ? 
            scenes.reduce((sum, scene) => sum + (scene.storyboard?.totalPanels || 0), 0) / scenes.length : 0
        },
        schedule: {
          total: schedules.length,
          byStatus: this.groupByField(schedules, 'status'),
          byType: this.groupByField(schedules, 'type'),
          upcomingCount: schedules.filter(s => s.date > new Date()).length
        },
        budget: budget ? {
          totalBudget: budget.totalBudget,
          totalSpent: budget.summary.totalSpent,
          percentageUsed: budget.summary.percentageUsed,
          overBudget: budget.summary.overBudget,
          categoriesCount: budget.categories.length,
          expensesCount: budget.expenses.length
        } : null,
        generatedAt: new Date()
      };

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Helper method to group array by field
  groupByField(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
}

module.exports = new ExportController();