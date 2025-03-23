"use client"
import React from 'react';

const InsightsComponent = ({ insights }) => {
  // Parse the insights to properly format them
  const formattedInsights = parseInsights(insights);
  
  return (
    <div className="insights-container">
      {formattedInsights.sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="mb-6">
          {section.title && (
            <h3 className="text-lg font-semibold mb-3 text-pink-400">
              {section.title}
            </h3>
          )}
          
          {section.items.length > 0 && (
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
              {section.items.map((item, itemIndex) => (
                <li key={`item-${sectionIndex}-${itemIndex}`}>{cleanMarkdown(item)}</li>
              ))}
            </ul>
          )}
          
          {section.subsections.map((subsection, subsectionIndex) => (
            <div key={`subsection-${sectionIndex}-${subsectionIndex}`} className="mt-4 mb-4 ml-2">
              <h4 className="text-md font-medium text-pink-300 mb-2">
                {subsection.title}
              </h4>
              
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                {subsection.items.map((item, itemIndex) => (
                  <li key={`subitem-${sectionIndex}-${subsectionIndex}-${itemIndex}`}>
                    {cleanMarkdown(item)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Function to clean markdown from text
function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold: **text** -> text
    .replace(/\*([^*]+)\*/g, '$1')      // Italic: *text* -> text
    .replace(/^#{1,6}\s+/g, '')         // Headers: # Heading -> Heading
    .replace(/^\s*[\-\*]\s+/g, '');     // Bullets: * item -> item
}

// Function to parse insights from any format
function parseInsights(insights) {
  // Log what's being passed to parseInsights
  console.log("Received insights:", insights);
  
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
      console.log("Successfully parsed JSON string:", parsedJson);
      
      // If parsedJson has a sections property, it's already in our format
      if (parsedJson.sections && Array.isArray(parsedJson.sections)) {
        return parsedJson;
      }
      
      // Otherwise, continue with normal parsing
      return parseInsights(parsedJson);
    } catch (e) {
      console.log("Failed to parse as JSON, continuing with normal parsing");
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
        items: ["Could not parse insights format. Please check the console for debugging information."],
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

// Debug component to show raw insights structure
export const DebugInsights = ({ insights }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4 mb-4">
      <h4 className="text-yellow-400 mb-2">Debugging Insights Object:</h4>
      <pre className="text-white text-sm overflow-auto max-h-60">
        {typeof insights === 'object' 
          ? JSON.stringify(insights, null, 2) 
          : insights}
      </pre>
    </div>
  );
};

export default InsightsComponent;