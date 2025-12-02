// PDF Export Utility using jsPDF
// This utility provides functions to export various project data to PDF format

export const exportScriptToPDF = async (scriptData: {
  projectTitle: string;
  content: string;
  scenes: any[];
  characters: any[];
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(scriptData.projectTitle, margin, yPosition);
  yPosition += 15;

  // Script content
  doc.setFontSize(12);
  doc.setFont('courier', 'normal');
  
  const lines = scriptData.content.split('\n');
  
  for (const line of lines) {
    const splitLines = doc.splitTextToSize(line || ' ', 170);
    
    for (const splitLine of splitLines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(splitLine, margin, yPosition);
      yPosition += lineHeight;
    }
  }

  // Add scenes summary on new page
  if (scriptData.scenes.length > 0) {
    doc.addPage();
    yPosition = margin;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Scene Breakdown', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    scriptData.scenes.forEach((scene, index) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Scene ${scene.number}: ${scene.title}`, margin, yPosition);
      yPosition += 5;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Location: ${scene.location} - ${scene.timeOfDay.toUpperCase()}`, margin + 5, yPosition);
      yPosition += 8;
    });
  }

  // Add characters on new page
  if (scriptData.characters.length > 0) {
    doc.addPage();
    yPosition = margin;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Character List', margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    scriptData.characters.forEach((char, index) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(`${index + 1}. ${char.name} - ${char.role}`, margin, yPosition);
      yPosition += 6;
    });
  }

  doc.save(`${scriptData.projectTitle}_script.pdf`);
};

export const exportStoryboardToPDF = async (storyboardData: {
  projectTitle: string;
  scenes: any[];
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${storyboardData.projectTitle} - Storyboard`, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  storyboardData.scenes.forEach((scene) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Scene ${scene.sceneNumber}: ${scene.title}`, margin, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Location: ${scene.location?.name || 'N/A'} - ${scene.location?.timeOfDay || 'N/A'}`, margin, yPosition);
    yPosition += 7;

    if (scene.description) {
      const descLines = doc.splitTextToSize(scene.description, 170);
      descLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
    }

    yPosition += 5;
  });

  doc.save(`${storyboardData.projectTitle}_storyboard.pdf`);
};

export const exportBudgetToPDF = async (budgetData: {
  projectTitle: string;
  expenses: any[];
  totalBudget: number;
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const margin = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${budgetData.projectTitle} - Budget`, margin, yPosition);
  yPosition += 15;

  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Budget: $${budgetData.totalBudget.toLocaleString()}`, margin, yPosition);
  yPosition += 10;

  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.text('Item', margin, yPosition);
  doc.text('Category', margin + 60, yPosition);
  doc.text('Quantity', margin + 110, yPosition);
  doc.text('Cost', margin + 150, yPosition);
  yPosition += 7;

  // Expenses
  doc.setFont('helvetica', 'normal');
  budgetData.expenses.forEach((expense) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = margin;
    }

    doc.text(expense.name || 'N/A', margin, yPosition);
    doc.text(expense.category || 'N/A', margin + 60, yPosition);
    doc.text(String(expense.quantity || 0), margin + 110, yPosition);
    doc.text(`$${(expense.totalCost || 0).toLocaleString()}`, margin + 150, yPosition);
    yPosition += 6;
  });

  doc.save(`${budgetData.projectTitle}_budget.pdf`);
};

export const exportScheduleToPDF = async (scheduleData: {
  projectTitle: string;
  items: any[];
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${scheduleData.projectTitle} - Schedule`, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  scheduleData.items.forEach((item) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(item.title || 'Untitled', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    const date = new Date(item.date);
    doc.text(`Date: ${date.toLocaleDateString()}`, margin, yPosition);
    yPosition += 5;
    
    if (item.location) {
      doc.text(`Location: ${item.location}`, margin, yPosition);
      yPosition += 5;
    }

    if (item.description) {
      const descLines = doc.splitTextToSize(item.description, 170);
      descLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    }

    yPosition += 8;
  });

  doc.save(`${scheduleData.projectTitle}_schedule.pdf`);
};

export const exportLocationsToPDF = async (locationsData: {
  projectTitle: string;
  locations: any[];
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${locationsData.projectTitle} - Locations`, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  locationsData.locations.forEach((location, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${location.name}`, margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${location.type || 'N/A'}`, margin + 5, yPosition);
    yPosition += 5;
    
    doc.text(`Status: ${location.status || 'N/A'}`, margin + 5, yPosition);
    yPosition += 5;

    if (location.address) {
      doc.text(`Address: ${location.address}`, margin + 5, yPosition);
      yPosition += 5;
    }

    yPosition += 8;
  });

  doc.save(`${locationsData.projectTitle}_locations.pdf`);
};

export const exportShotListToPDF = async (shotListData: {
  projectTitle: string;
  shots: any[];
}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPosition = 20;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${shotListData.projectTitle} - Shot List`, margin, yPosition);
  yPosition += 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  shotListData.shots.forEach((shot, index) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Shot ${index + 1}: ${shot.shotNumber || 'N/A'}`, margin, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(`Type: ${shot.shotType || 'N/A'}`, margin + 5, yPosition);
    yPosition += 5;
    
    doc.text(`Camera: ${shot.cameraAngle || 'N/A'}`, margin + 5, yPosition);
    yPosition += 5;

    if (shot.description) {
      const descLines = doc.splitTextToSize(`Description: ${shot.description}`, 170);
      descLines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
    }

    yPosition += 6;
  });

  doc.save(`${shotListData.projectTitle}_shotlist.pdf`);
};
