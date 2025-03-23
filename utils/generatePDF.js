"use client"
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to clean markdown from text
function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold: **text** -> text
    .replace(/\*([^*]+)\*/g, '$1')      // Italic: *text* -> text
    .replace(/^#{1,6}\s+/g, '')         // Headers: # Heading -> Heading
    .replace(/^\s*[\-\*]\s+/g, '');     // Bullets: * item -> item
}

// Helper function to parse insights
function parseInsights(insights) {
  // Default structured format
  const result = {
    sections: []
  };
  
  // If insights is empty or undefined, return empty structure
  if (!insights) {
    return result;
  }
  
  // SPECIAL CASE: Check if insights is a string that looks like JSON
  if (typeof insights === 'string' && 
      (insights.trim().startsWith('{') || insights.trim().startsWith('['))) {
    try {
      const parsedJson = JSON.parse(insights);
      
      // If parsedJson has a sections property, it's already in our format
      if (parsedJson.sections && Array.isArray(parsedJson.sections)) {
        return parsedJson;
      }
      
      // Otherwise, continue with normal parsing
      return parseInsights(parsedJson);
    } catch (e) {
      // Continue with normal parsing
    }
  }
  
  // If insights is an object but not an array, check specific formats
  if (typeof insights === 'object' && !Array.isArray(insights)) {
    // Check if it already has the expected structure
    if (insights.sections && Array.isArray(insights.sections)) {
      return insights;
    }
    
    // Try to extract sections or convert to string
    if (insights.toString() !== '[object Object]') {
      // If toString gives useful info, use that
      return parseInsights(insights.toString());
    }
    
    // Try common fields that might contain the actual insights
    const possibleFields = ['text', 'content', 'items', 'insights', 'value', 'data'];
    for (const field of possibleFields) {
      if (insights[field]) {
        return parseInsights(insights[field]);
      }
    }
    
    // If all else fails, try to stringify the object
    try {
      const jsonString = JSON.stringify(insights);
      return parseInsights(jsonString);
    } catch (e) {
      // Create a fallback section with a generic message
      result.sections.push({
        title: "Insights",
        items: ["Could not parse insights format."],
        subsections: []
      });
      return result;
    }
  }
  
  // Ensure insights is an array of strings
  const insightsArray = Array.isArray(insights) 
    ? insights 
    : typeof insights === 'string'
      ? insights.split('\n').filter(line => line.trim()) 
      : [String(insights)];
  
  let currentSection = null;
  let currentSubsection = null;
  
  // Process each line
  for (const line of insightsArray) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if line is a main section heading (## Heading or # Heading)
    if (trimmedLine.match(/^#{1,2}\s+/)) {
      const title = trimmedLine.replace(/^#{1,2}\s+/, '');
      currentSection = { title, items: [], subsections: [] };
      result.sections.push(currentSection);
      currentSubsection = null;
      continue;
    }
    
    // Check if line is a subsection heading (bold text with colon - **Heading:** or *Heading:*)
    if (trimmedLine.match(/^\*\*.*:\*\*$/) || trimmedLine.match(/^\*.*:\*$/)) {
      if (!currentSection) {
        // Create a default section if none exists
        currentSection = { title: null, items: [], subsections: [] };
        result.sections.push(currentSection);
      }
      
      const title = trimmedLine.replace(/^\*\*|\*\*$|\*|:/g, '').trim();
      currentSubsection = { title, items: [] };
      currentSection.subsections.push(currentSubsection);
      continue;
    }
    
    // Check if line is a bullet point or list item (starts with *, -, or number.)
    const bulletMatch = trimmedLine.match(/^[\*\-•]\s+(.+)$/) || trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      
      if (currentSubsection) {
        // Add to current subsection
        currentSubsection.items.push(itemText);
      } else if (currentSection) {
        // Add to current section
        currentSection.items.push(itemText);
      } else {
        // Create a default section with this item
        currentSection = { title: null, items: [itemText], subsections: [] };
        result.sections.push(currentSection);
      }
      continue;
    }
    
    // Regular text (not a heading or bullet)
    if (currentSubsection) {
      currentSubsection.items.push(trimmedLine);
    } else if (currentSection) {
      currentSection.items.push(trimmedLine);
    } else {
      // Create a default section with this text
      currentSection = { title: null, items: [trimmedLine], subsections: [] };
      result.sections.push(currentSection);
    }
  }
  
  // If no sections were created, create one default section with all text
  if (result.sections.length === 0 && insightsArray.length > 0) {
    result.sections.push({
      title: "Insights",
      items: insightsArray,
      subsections: []
    });
  }
  
  return result;
}

const generatePDF = (results, meetingInfo = null) => {
  // Create a PDF document with professional formatting
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to add a page header
  const addPageHeader = (pageNumber, totalPages) => {
    // Blue header bar
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    // Add logo or icon if available (you can replace this with your own logo)
    /*
    const logo = new Image();
    logo.src = '/logo.png';
    pdf.addImage(logo, 'PNG', margin, 5, 15, 15);
    */
    
    // Title in header
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("SyncScribe AI", margin, 15);
    
    // Add footer
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated by SyncScribe AI`, margin, pageHeight - 10);
    pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 10);
  };
  
  // Add page header to first page
  addPageHeader(1, "?");
  
  // Set up positioning
  let yPosition = 40;
  
  // Add title and info
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(37, 99, 235); // Blue color
  pdf.text("SyncScribe AI Report", margin, yPosition);
  yPosition += 15;
  
  // Add date and meeting info
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(75, 85, 99); // Gray color
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(`Generated on: ${currentDate}`, margin, yPosition);
  yPosition += 8;
  
  if (meetingInfo) {
    const topic = meetingInfo.topic || 'Untitled Meeting';
    const id = meetingInfo.id || 'N/A';
    
    pdf.text(`Meeting: ${topic}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Meeting ID: ${id}`, margin, yPosition);
    yPosition += 8;
  }
  
  // Add a divider
  yPosition += 5;
  pdf.setDrawColor(229, 231, 235); // Light gray
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Add summary section
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(37, 99, 235); // Blue color
  pdf.text("Summary", margin, yPosition);
  yPosition += 10;
  
  // Add summary content
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55); // Dark gray
  
  const summaryText = results.summary || "No summary available.";
  const summaryLines = pdf.splitTextToSize(summaryText, contentWidth);
  pdf.text(summaryLines, margin, yPosition);
  yPosition += (summaryLines.length * 7) + 10;
  
  // Add insights section
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(37, 99, 235); // Blue color
  pdf.text("Insights & Action Items", margin, yPosition);
  yPosition += 10;
  
  // Process insights
  let insightsForPDF = results.insights || [];
  
  // Parse and format the insights
  const formattedInsights = parseInsights(insightsForPDF);
  
  // Check if yPosition is close to page bottom, if so, add a new page
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    addPageHeader(2, "?");
    yPosition = 40;
  }
  
  // Render each section
  formattedInsights.sections.forEach(section => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      const pageNum = pdf.internal.getNumberOfPages();
      addPageHeader(pageNum, "?");
      yPosition = 40;
    }
    
    // Render section title
    if (section.title) {
      // Clean any markdown from the title
      const cleanTitle = cleanMarkdown(section.title);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(147, 51, 234); // Purple color
      pdf.text(cleanTitle, margin, yPosition);
      yPosition += 8;
    }
    
    // Render section items
    section.items.forEach(item => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        const pageNum = pdf.internal.getNumberOfPages();
        addPageHeader(pageNum, "?");
        yPosition = 40;
      }
      
      // Clean any markdown from the item
      const cleanItem = cleanMarkdown(item);
      
      // Render bullet point
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(31, 41, 55); // Dark gray
      
      // Split long text into multiple lines
      const bulletLines = pdf.splitTextToSize(`• ${cleanItem}`, contentWidth - 5);
      
      // Add text with indent
      pdf.text(bulletLines, margin + 5, yPosition);
      yPosition += (bulletLines.length * 6) + 3;
    });
    
    // Render subsections
    section.subsections.forEach(subsection => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        const pageNum = pdf.internal.getNumberOfPages();
        addPageHeader(pageNum, "?");
        yPosition = 40;
      }
      
      // Render subsection title
      if (subsection.title) {
        // Clean any markdown from the title
        const cleanTitle = cleanMarkdown(subsection.title);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(236, 72, 153); // Pink color
        pdf.text(cleanTitle, margin + 5, yPosition);
        yPosition += 8;
      }
      
      // Render subsection items
      subsection.items.forEach(item => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          const pageNum = pdf.internal.getNumberOfPages();
          addPageHeader(pageNum, "?");
          yPosition = 40;
        }
        
        // Clean any markdown from the item
        const cleanItem = cleanMarkdown(item);
        
        // Render bullet point
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55); // Dark gray
        
        // Split long text into multiple lines
        const bulletLines = pdf.splitTextToSize(`• ${cleanItem}`, contentWidth - 15);
        
        // Add text with double indent
        pdf.text(bulletLines, margin + 10, yPosition);
        yPosition += (bulletLines.length * 6) + 3;
      });
    });
    
    // Add some space after each section
    yPosition += 5;
  });
  
  // Add transcript section (on a new page)
  pdf.addPage();
  const pageNum = pdf.internal.getNumberOfPages();
  addPageHeader(pageNum, "?");
  yPosition = 40;
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(37, 99, 235); // Blue color
  pdf.text("Full Transcript", margin, yPosition);
  yPosition += 10;
  
  // Add transcript content with speaker formatting
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(31, 41, 55); // Dark gray
  
  const transcriptText = results.transcript || "No transcript available.";
  
  // Process transcript by trying to identify speakers and format accordingly
  const transcriptLines = transcriptText.split('\n');
  for (const line of transcriptLines) {
    if (!line.trim()) continue;
    
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      const newPageNum = pdf.internal.getNumberOfPages();
      addPageHeader(newPageNum, "?");
      yPosition = 40;
    }
    
    // Check if line contains speaker identification
    if (line.includes('Speaker') || line.includes('Unknown:')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        const speaker = parts[0].trim();
        const speech = parts.slice(1).join(':').trim();
        
        // Add speaker in bold
        pdf.setFont("helvetica", "bold");
        pdf.text(`${speaker}:`, margin, yPosition);
        
        // Measure width of speaker text to position the speech correctly
        const speakerWidth = pdf.getTextWidth(`${speaker}: `);
        
        // Add speech in normal font
        pdf.setFont("helvetica", "normal");
        
        // Split speech text to fit within remaining width
        const maxSpeechWidth = contentWidth - speakerWidth;
        const speechLines = pdf.splitTextToSize(speech, maxSpeechWidth);
        
        // First line is positioned after the speaker
        if (speechLines.length > 0) {
          pdf.text(speechLines[0], margin + speakerWidth, yPosition);
        }
        
        // Subsequent lines are indented
        if (speechLines.length > 1) {
          for (let i = 1; i < speechLines.length; i++) {
            yPosition += 6;
            pdf.text(speechLines[i], margin + speakerWidth, yPosition);
          }
        }
      } else {
        // Handle case where line doesn't split properly
        const textLines = pdf.splitTextToSize(line, contentWidth);
        pdf.text(textLines, margin, yPosition);
        yPosition += (textLines.length - 1) * 6;
      }
    } else {
      // Regular text without speaker identification
      const textLines = pdf.splitTextToSize(line, contentWidth);
      pdf.text(textLines, margin, yPosition);
      yPosition += (textLines.length - 1) * 6;
    }
    
    yPosition += 8; // Space between paragraphs
  }
  
  // Update total page numbers
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 10);
  }
  
  // Save the PDF
  pdf.save('syncscribe-report.pdf');
};

export default generatePDF;