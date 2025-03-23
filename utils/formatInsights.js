// Function to format insights from markdown to HTML components
const formatInsights = (insightsText) => {
    // Check if the insights are empty
    if (!insightsText || insightsText.length === 0) {
      return {
        sections: []
      };
    }
  
    // Try to parse the structured insights
    try {
      // Split insights into sections
      let currentSection = null;
      let currentSubsection = null;
      const sections = [];
      
      // Process line by line for better structure detection
      const lines = Array.isArray(insightsText) 
        ? insightsText 
        : insightsText.split('\n').filter(line => line.trim());
  
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Detect section headers (## headings)
        if (trimmedLine.startsWith('## ') || trimmedLine.startsWith('# ')) {
          currentSection = {
            title: trimmedLine.replace(/^#+ /, ''),
            items: [],
            subsections: []
          };
          sections.push(currentSection);
          currentSubsection = null;
          continue;
        }
        
        // Detect subsection headers (bold text or **: headings)
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith(':**')) {
          if (!currentSection) {
            currentSection = {
              title: "Insights",
              items: [],
              subsections: []
            };
            sections.push(currentSection);
          }
          
          currentSubsection = {
            title: trimmedLine.replace(/^\*\*|\:\*\*$/g, ''),
            items: []
          };
          currentSection.subsections.push(currentSubsection);
          continue;
        }
        
        // Process list items
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          const itemText = trimmedLine.replace(/^[*-] /, '');
          
          // Add to subsection if there is one active
          if (currentSubsection) {
            currentSubsection.items.push(itemText);
          }
          // Otherwise add to current section
          else if (currentSection) {
            currentSection.items.push(itemText);
          }
          // If no section exists yet, create a default one
          else {
            currentSection = {
              title: "Insights",
              items: [itemText],
              subsections: []
            };
            sections.push(currentSection);
          }
          continue;
        }
        
        // Regular text (not a list item or header)
        if (currentSubsection) {
          currentSubsection.items.push(trimmedLine);
        } else if (currentSection) {
          currentSection.items.push(trimmedLine);
        } else {
          currentSection = {
            title: "Insights",
            items: [trimmedLine],
            subsections: []
          };
          sections.push(currentSection);
        }
      }
      
      return { sections };
    } catch (error) {
      console.error("Error formatting insights:", error);
      
      // Fallback - return insights as a single section with items
      return {
        sections: [
          {
            title: "Insights",
            items: Array.isArray(insightsText) ? insightsText : [insightsText],
            subsections: []
          }
        ]
      };
    }
  };
  
  export default formatInsights;