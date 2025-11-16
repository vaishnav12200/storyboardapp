const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  constructor() {
    this.pageMargin = 50;
    this.lineHeight = 1.5;
    this.defaultFontSize = 12;
  }

  // Generate storyboard PDF
  async generateStoryboardPDF(project, scenes) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      }
    });

    // Title page
    this.addTitlePage(doc, project);
    doc.addPage();

    // Table of contents
    this.addTableOfContents(doc, scenes);
    doc.addPage();

    // Storyboard scenes
    for (const scene of scenes) {
      await this.addStoryboardScene(doc, scene);
      if (scene !== scenes[scenes.length - 1]) {
        doc.addPage();
      }
    }

    return doc;
  }

  // Generate script PDF
  async generateScriptPDF(project, scenes) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 } // Standard screenplay margins
    });

    // Title page
    this.addScriptTitlePage(doc, project);
    doc.addPage();

    // Script content
    for (const scene of scenes) {
      this.addScriptScene(doc, scene);
    }

    return doc;
  }

  // Generate schedule PDF
  async generateSchedulePDF(project, schedules) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      }
    });

    // Header
    this.addScheduleHeader(doc, project);
    
    // Group schedules by date
    const schedulesByDate = this.groupSchedulesByDate(schedules);

    for (const [date, daySchedules] of Object.entries(schedulesByDate)) {
      this.addDaySchedule(doc, date, daySchedules);
    }

    return doc;
  }

  // Generate budget report PDF
  async generateBudgetPDF(budget, expenses) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      }
    });

    // Header
    this.addBudgetHeader(doc, budget);
    
    // Summary
    this.addBudgetSummary(doc, budget);
    
    // Categories breakdown
    this.addCategoriesBreakdown(doc, budget);
    
    // Expenses list
    if (expenses && expenses.length > 0) {
      doc.addPage();
      this.addExpensesList(doc, expenses);
    }

    return doc;
  }

  // Add title page for storyboard
  addTitlePage(doc, project) {
    const centerX = doc.page.width / 2;
    
    // Project title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(project.title.toUpperCase(), 0, 200, {
         width: doc.page.width,
         align: 'center'
       });

    // Subtitle
    doc.fontSize(16)
       .font('Helvetica')
       .text('STORYBOARD', 0, 250, {
         width: doc.page.width,
         align: 'center'
       });

    // Project details
    if (project.type) {
      doc.fontSize(12)
         .text(`Type: ${project.type}`, 0, 300, {
           width: doc.page.width,
           align: 'center'
         });
    }

    if (project.genre) {
      doc.text(`Genre: ${project.genre}`, 0, 320, {
         width: doc.page.width,
         align: 'center'
       });
    }

    // Date
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 0, 380, {
       width: doc.page.width,
       align: 'center'
     });
  }

  // Add table of contents
  addTableOfContents(doc, scenes) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('TABLE OF CONTENTS', this.pageMargin, 100);

    let y = 140;
    
    scenes.forEach(scene => {
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Scene ${scene.sceneNumber}: ${scene.title}`, this.pageMargin, y);
      
      y += 20;
      
      // Add page break if needed
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 100;
      }
    });
  }

  // Add storyboard scene
  async addStoryboardScene(doc, scene) {
    let y = 100;

    // Scene header
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`SCENE ${scene.sceneNumber}: ${scene.title.toUpperCase()}`, this.pageMargin, y);

    y += 40;

    // Scene details
    if (scene.location) {
      const locationText = `${scene.location.type?.toUpperCase() || 'INT'} - ${scene.location.name?.toUpperCase() || 'LOCATION'} - ${scene.location.timeOfDay?.toUpperCase() || 'DAY'}`;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(locationText, this.pageMargin, y);
      y += 20;
    }

    // Description
    if (scene.description) {
      doc.fontSize(12)
         .font('Helvetica')
         .text(scene.description, this.pageMargin, y, {
           width: doc.page.width - (this.pageMargin * 2),
           lineGap: 5
         });
      y += doc.heightOfString(scene.description, {
        width: doc.page.width - (this.pageMargin * 2),
        lineGap: 5
      }) + 20;
    }

    // Storyboard frames
    if (scene.storyboardFrames && scene.storyboardFrames.length > 0) {
      for (const frame of scene.storyboardFrames) {
        // Check if we need a new page
        if (y > doc.page.height - 300) {
          doc.addPage();
          y = 100;
        }

        await this.addStoryboardFrame(doc, frame, y);
        y += 280; // Frame height + spacing
      }
    }

    // Dialogue/Action
    if (scene.dialogue || scene.action) {
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 100;
      }

      if (scene.action) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('ACTION:', this.pageMargin, y);
        y += 15;
        
        doc.font('Helvetica')
           .text(scene.action, this.pageMargin, y, {
             width: doc.page.width - (this.pageMargin * 2),
             lineGap: 3
           });
        y += doc.heightOfString(scene.action, {
          width: doc.page.width - (this.pageMargin * 2),
          lineGap: 3
        }) + 15;
      }

      if (scene.dialogue) {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('DIALOGUE:', this.pageMargin, y);
        y += 15;
        
        doc.font('Helvetica')
           .text(scene.dialogue, this.pageMargin, y, {
             width: doc.page.width - (this.pageMargin * 2),
             lineGap: 3
           });
      }
    }
  }

  // Add storyboard frame
  async addStoryboardFrame(doc, frame, y) {
    const frameWidth = 400;
    const frameHeight = 225; // 16:9 aspect ratio
    const frameX = (doc.page.width - frameWidth) / 2;

    // Frame border
    doc.rect(frameX, y, frameWidth, frameHeight)
       .stroke();

    // Frame image (if available)
    if (frame.imageUrl) {
      try {
        // Note: In a real implementation, you'd need to handle image loading
        // doc.image(frame.imageUrl, frameX + 5, y + 5, {
        //   width: frameWidth - 10,
        //   height: frameHeight - 10,
        //   fit: [frameWidth - 10, frameHeight - 10]
        // });
      } catch (error) {
        console.error('Error loading frame image:', error);
      }
    }

    // Frame number and description
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`Frame ${frame.frameNumber}`, frameX, y + frameHeight + 10);

    if (frame.description) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(frame.description, frameX, y + frameHeight + 25, {
           width: frameWidth,
           lineGap: 2
         });
    }
  }

  // Add script title page
  addScriptTitlePage(doc, project) {
    const centerX = doc.page.width / 2;
    
    // Project title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(project.title.toUpperCase(), 0, 250, {
         width: doc.page.width,
         align: 'center'
       });

    // Subtitle
    doc.fontSize(16)
       .font('Helvetica')
       .text('SCREENPLAY', 0, 300, {
         width: doc.page.width,
         align: 'center'
       });

    // Author
    if (project.owner) {
      doc.fontSize(12)
         .text(`Written by ${project.owner.firstName} ${project.owner.lastName}`, 0, 400, {
           width: doc.page.width,
           align: 'center'
         });
    }

    // Date
    doc.text(`${new Date().toLocaleDateString()}`, 0, 450, {
       width: doc.page.width,
       align: 'center'
     });
  }

  // Add script scene
  addScriptScene(doc, scene) {
    let y = doc.y || 100;

    // Check if we need a new page
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 100;
    }

    // Scene heading
    if (scene.location) {
      const sceneHeading = `${scene.location.type?.toUpperCase() || 'INT'}. ${scene.location.name?.toUpperCase() || 'LOCATION'} - ${scene.location.timeOfDay?.toUpperCase() || 'DAY'}`;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(sceneHeading, 72, y);
      y += 24;
    }

    // Action/Description
    if (scene.description || scene.action) {
      const actionText = scene.action || scene.description;
      doc.fontSize(12)
         .font('Helvetica')
         .text(actionText, 72, y, {
           width: doc.page.width - 144,
           lineGap: 6
         });
      y += doc.heightOfString(actionText, {
        width: doc.page.width - 144,
        lineGap: 6
      }) + 12;
    }

    // Dialogue
    if (scene.dialogue) {
      const dialogueLines = scene.dialogue.split('\n');
      
      dialogueLines.forEach(line => {
        if (line.trim()) {
          // Character name (if line starts with uppercase)
          if (line === line.toUpperCase() && line.length < 50) {
            y += 12;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text(line.trim(), 216, y);
            y += 18;
          } else {
            // Dialogue text
            doc.fontSize(12)
               .font('Helvetica')
               .text(line.trim(), 144, y, {
                 width: 252,
                 lineGap: 3
               });
            y += doc.heightOfString(line.trim(), {
              width: 252,
              lineGap: 3
            }) + 6;
          }
        }
      });
    }

    y += 24; // Scene spacing
    doc.y = y;
  }

  // Add schedule header
  addScheduleHeader(doc, project) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`SHOOTING SCHEDULE - ${project.title.toUpperCase()}`, this.pageMargin, 50);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString()}`, this.pageMargin, 80);

    // Draw a line
    doc.moveTo(this.pageMargin, 100)
       .lineTo(doc.page.width - this.pageMargin, 100)
       .stroke();
  }

  // Group schedules by date
  groupSchedulesByDate(schedules) {
    const grouped = {};
    
    schedules.forEach(schedule => {
      const date = new Date(schedule.date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });

    return grouped;
  }

  // Add day schedule
  addDaySchedule(doc, date, schedules) {
    let y = doc.y || 120;

    // Check if we need a new page
    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 100;
    }

    // Date header
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(date, this.pageMargin, y);
    y += 30;

    // Schedule items
    schedules.forEach(schedule => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 100;
      }

      // Time
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(schedule.startTime || 'TBD', this.pageMargin, y);

      // Scene/Activity
      doc.font('Helvetica')
         .text(schedule.title, this.pageMargin + 80, y, {
           width: 200
         });

      // Location
      if (schedule.location) {
        doc.text(schedule.location.name || 'Location TBD', this.pageMargin + 300, y, {
          width: 150
        });
      }

      y += 20;
    });

    y += 20; // Day spacing
    doc.y = y;
  }

  // Add budget header
  addBudgetHeader(doc, budget) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`BUDGET REPORT - ${budget.projectTitle?.toUpperCase() || 'PROJECT'}`, this.pageMargin, 50);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString()}`, this.pageMargin, 80);

    // Draw a line
    doc.moveTo(this.pageMargin, 100)
       .lineTo(doc.page.width - this.pageMargin, 100)
       .stroke();
  }

  // Add budget summary
  addBudgetSummary(doc, budget) {
    let y = 120;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('BUDGET SUMMARY', this.pageMargin, y);
    y += 30;

    // Total budget
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Budget:', this.pageMargin, y);
    doc.text(`$${budget.totalBudget?.toLocaleString() || '0'}`, this.pageMargin + 200, y);
    y += 20;

    // Total spent
    doc.text('Total Spent:', this.pageMargin, y);
    doc.text(`$${budget.totalSpent?.toLocaleString() || '0'}`, this.pageMargin + 200, y);
    y += 20;

    // Remaining
    const remaining = (budget.totalBudget || 0) - (budget.totalSpent || 0);
    doc.text('Remaining:', this.pageMargin, y);
    doc.fillColor(remaining >= 0 ? 'green' : 'red')
       .text(`$${remaining.toLocaleString()}`, this.pageMargin + 200, y)
       .fillColor('black');
    y += 30;

    doc.y = y;
  }

  // Add categories breakdown
  addCategoriesBreakdown(doc, budget) {
    let y = doc.y || 200;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('CATEGORIES BREAKDOWN', this.pageMargin, y);
    y += 30;

    if (budget.categories && budget.categories.length > 0) {
      // Table headers
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Category', this.pageMargin, y)
         .text('Budgeted', this.pageMargin + 200, y)
         .text('Spent', this.pageMargin + 300, y)
         .text('Remaining', this.pageMargin + 400, y);
      
      y += 20;

      // Draw header line
      doc.moveTo(this.pageMargin, y)
         .lineTo(doc.page.width - this.pageMargin, y)
         .stroke();
      y += 10;

      // Category rows
      budget.categories.forEach(category => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 100;
        }

        const remaining = (category.budgetAmount || 0) - (category.spentAmount || 0);

        doc.fontSize(10)
           .font('Helvetica')
           .text(category.name, this.pageMargin, y)
           .text(`$${category.budgetAmount?.toLocaleString() || '0'}`, this.pageMargin + 200, y)
           .text(`$${category.spentAmount?.toLocaleString() || '0'}`, this.pageMargin + 300, y);
        
        doc.fillColor(remaining >= 0 ? 'green' : 'red')
           .text(`$${remaining.toLocaleString()}`, this.pageMargin + 400, y)
           .fillColor('black');

        y += 15;
      });
    }

    doc.y = y + 20;
  }

  // Add expenses list
  addExpensesList(doc, expenses) {
    let y = 100;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('EXPENSES LIST', this.pageMargin, y);
    y += 30;

    // Table headers
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Date', this.pageMargin, y)
       .text('Description', this.pageMargin + 80, y)
       .text('Category', this.pageMargin + 250, y)
       .text('Amount', this.pageMargin + 350, y);
    
    y += 20;

    // Draw header line
    doc.moveTo(this.pageMargin, y)
       .lineTo(doc.page.width - this.pageMargin, y)
       .stroke();
    y += 10;

    // Expense rows
    expenses.forEach(expense => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 100;
      }

      doc.fontSize(10)
         .font('Helvetica')
         .text(new Date(expense.date).toLocaleDateString(), this.pageMargin, y)
         .text(expense.description || 'N/A', this.pageMargin + 80, y, {
           width: 160,
           ellipsis: true
         })
         .text(expense.category || 'Other', this.pageMargin + 250, y)
         .text(`$${expense.amount?.toLocaleString() || '0'}`, this.pageMargin + 350, y);

      y += 15;
    });
  }

  // Generate call sheet PDF
  async generateCallSheetPDF(project, schedule, cast, crew) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      }
    });

    // Header
    this.addCallSheetHeader(doc, project, schedule);
    
    // Schedule details
    this.addCallSheetSchedule(doc, schedule);
    
    // Cast list
    if (cast && cast.length > 0) {
      this.addCallSheetCast(doc, cast);
    }
    
    // Crew list
    if (crew && crew.length > 0) {
      this.addCallSheetCrew(doc, crew);
    }

    return doc;
  }

  // Add call sheet header
  addCallSheetHeader(doc, project, schedule) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('CALL SHEET', 0, 50, {
         width: doc.page.width,
         align: 'center'
       });

    doc.fontSize(14)
       .text(project.title.toUpperCase(), 0, 80, {
         width: doc.page.width,
         align: 'center'
       });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Shoot Date: ${new Date(schedule.date).toLocaleDateString()}`, 0, 110, {
         width: doc.page.width,
         align: 'center'
       });

    // Draw a line
    doc.moveTo(this.pageMargin, 130)
       .lineTo(doc.page.width - this.pageMargin, 130)
       .stroke();
  }

  // Add call sheet schedule
  addCallSheetSchedule(doc, schedule) {
    let y = 150;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('SCHEDULE', this.pageMargin, y);
    y += 25;

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Location: ${schedule.location?.name || 'TBD'}`, this.pageMargin, y);
    y += 15;

    doc.text(`Call Time: ${schedule.callTime || 'TBD'}`, this.pageMargin, y);
    y += 15;

    doc.text(`Wrap Time: ${schedule.wrapTime || 'TBD'}`, this.pageMargin, y);
    y += 15;

    if (schedule.scenes && schedule.scenes.length > 0) {
      doc.text('Scenes:', this.pageMargin, y);
      y += 15;
      
      schedule.scenes.forEach(scene => {
        doc.text(`  • Scene ${scene.sceneNumber}: ${scene.title}`, this.pageMargin + 20, y);
        y += 12;
      });
    }

    doc.y = y + 20;
  }

  // Add call sheet cast
  addCallSheetCast(doc, cast) {
    let y = doc.y || 300;

    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 100;
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('CAST', this.pageMargin, y);
    y += 25;

    // Table headers
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Character', this.pageMargin, y)
       .text('Actor', this.pageMargin + 150, y)
       .text('Call Time', this.pageMargin + 300, y);
    
    y += 20;

    cast.forEach(member => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 100;
      }

      doc.fontSize(10)
         .font('Helvetica')
         .text(member.characterName || 'N/A', this.pageMargin, y)
         .text(member.actorName || 'TBD', this.pageMargin + 150, y)
         .text(member.callTime || 'TBD', this.pageMargin + 300, y);

      y += 15;
    });

    doc.y = y + 20;
  }

  // Add call sheet crew
  addCallSheetCrew(doc, crew) {
    let y = doc.y || 400;

    if (y > doc.page.height - 200) {
      doc.addPage();
      y = 100;
    }

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('CREW', this.pageMargin, y);
    y += 25;

    // Table headers
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Role', this.pageMargin, y)
       .text('Name', this.pageMargin + 150, y)
       .text('Call Time', this.pageMargin + 300, y);
    
    y += 20;

    crew.forEach(member => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 100;
      }

      doc.fontSize(10)
         .font('Helvetica')
         .text(member.role || 'N/A', this.pageMargin, y)
         .text(member.name || 'TBD', this.pageMargin + 150, y)
         .text(member.callTime || 'TBD', this.pageMargin + 300, y);

      y += 15;
    });
  }

  // Save PDF to buffer
  async savePDFToBuffer(doc) {
    return new Promise((resolve, reject) => {
      const buffers = [];
      
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      doc.end();
    });
  }

  // Save PDF to file
  async savePDFToFile(doc, filePath) {
    const buffer = await this.savePDFToBuffer(doc);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}

module.exports = PDFService;