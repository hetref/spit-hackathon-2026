/**
 * GEMINI AI UTILITY
 * High-accuracy JSON generation for layout builder
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Clean up common JSON issues
 */
function cleanupJSON(jsonText) {
  return jsonText
    .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
    .trim();
}

/**
 * Aggressive JSON cleanup as last resort
 */
function aggressiveJSONCleanup(jsonText) {
  let cleaned = jsonText;
  
  // Remove all trailing commas more aggressively
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');
  
  // Fix single quotes to double quotes
  cleaned = cleaned.replace(/'/g, '"');
  
  // Remove comments (// and /* */)
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Fix missing commas between properties (common AI mistake)
  cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
  cleaned = cleaned.replace(/}\s*\n\s*"/g, '},\n"');
  cleaned = cleaned.replace(/]\s*\n\s*"/g, '],\n"');
  
  return cleaned.trim();
}

/**
 * Generate layout JSON with strict validation
 */
export async function generateLayout({ description, businessType, pageType = 'home' }) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",  // Force JSON output
    }
  });

  const prompt = buildLayoutPrompt(description, businessType, pageType);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('=== RAW AI RESPONSE ===');
    console.log(text);
    console.log('======================');
    
    // Extract JSON from response (handles markdown code blocks)
    let jsonText = text;
    
    // Try to extract from markdown code block first
    const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    } else {
      // Try to find JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }
    
    console.log('=== EXTRACTED JSON ===');
    console.log(jsonText);
    console.log('=====================');
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
      .trim();
    
    // Parse and validate
    let layout;
    try {
      layout = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonText.substring(0, 500));
      throw new Error(`Invalid JSON from AI: ${parseError.message}`);
    }
    
    // Sanitize to fix common AI mistakes
    layout = sanitizeLayout(layout);
    
    // Validate structure
    validateLayout(layout);
    
    return {
      success: true,
      layout: layout.containers,
      metadata: {
        businessType,
        pageType,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini generation error:', error);
    return {
      success: false,
      error: error.message,
      fallback: getFallbackLayout(businessType, pageType)
    };
  }
}

/**
 * Generate content for a specific component
 */
export async function generateComponentContent({ componentType, context, businessType }) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 1024,
    }
  });

  const prompt = buildContentPrompt(componentType, context, businessType);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    const content = JSON.parse(jsonText);
    
    return {
      success: true,
      content
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Build detailed prompt for layout generation
 */
function buildLayoutPrompt(description, businessType, pageType) {
  return `You are a professional web designer creating a ${pageType} page for a ${businessType} business.

DESCRIPTION: ${description}

Generate a complete page layout using ONLY these component types:
- Hero: Main banner with title, subtitle, CTA button
- Features: Grid of feature cards with icons
- CTA: Call-to-action section
- Text: Paragraph text
- Heading: Section headings (use level as STRING: "h1", "h2", "h3", etc.)
- Image: Images with optional captions
- Button: Action buttons
- Gallery: Image gallery
- Navbar: Navigation menu
- Footer: Footer with links
- Video: Embedded videos
- Map: Google Maps embed

CRITICAL JSON STRUCTURE - Follow EXACTLY:

{
  "containers": [
    {
      "id": "container-1",
      "type": "container",
      "settings": {
        "direction": "horizontal",
        "contentWidth": "boxed",
        "maxWidth": 1280,
        "gap": 16,
        "verticalAlign": "stretch"
      },
      "styles": {
        "backgroundColor": "#ffffff",
        "paddingTop": 60,
        "paddingBottom": 60
      },
      "columns": [
        {
          "id": "col-1",
          "width": 12,
          "components": [
            {
              "id": "hero-1",
              "type": "Hero",
              "props": {
                "title": "Your Compelling Title",
                "subtitle": "Engaging subtitle text",
                "ctaText": "Get Started",
                "ctaLink": "#contact",
                "backgroundImage": ""
              },
              "styles": {
                "backgroundColor": "#f3f4f6",
                "textColor": "#1f2937",
                "paddingTop": 80,
                "paddingBottom": 80
              }
            }
          ]
        }
      ]
    }
  ]
}

COMPONENT PROP EXAMPLES:

Hero:
{
  "type": "Hero",
  "props": {
    "title": "string",
    "subtitle": "string",
    "ctaText": "string",
    "ctaLink": "string"
  }
}

Heading:
{
  "type": "Heading",
  "props": {
    "text": "string",
    "level": "h2"  // MUST be string: "h1", "h2", "h3", "h4", "h5", or "h6"
  }
}

Text:
{
  "type": "Text",
  "props": {
    "content": "string",
    "variant": "p"  // MUST be string: "p", "h1", "h2", etc.
  }
}

Features:
{
  "type": "Features",
  "props": {
    "heading": "string",
    "items": [
      {
        "icon": "⚡",
        "title": "string",
        "description": "string"
      }
    ]
  }
}

Button:
{
  "type": "Button",
  "props": {
    "text": "string",
    "link": "string",
    "variant": "primary"  // string: "primary", "secondary", or "outline"
  }
}

Image:
{
  "type": "Image",
  "props": {
    "src": "https://via.placeholder.com/800x400",
    "alt": "string",
    "width": 800,  // number
    "height": 400  // number
  }
}

RULES:
1. Each container MUST have unique id starting with "container-"
2. Each column MUST have unique id starting with "col-"
3. Each component MUST have unique id like "hero-1", "features-1", "heading-1"
4. Column widths MUST sum to 12 in horizontal containers
5. Use realistic, professional content (no placeholders like "Lorem ipsum")
6. Include 4-6 containers for a complete page
7. Vary component types for visual interest
8. Use appropriate colors (hex codes as strings like "#ffffff")
9. Numeric values (paddingTop, width, height, gap, maxWidth) must be numbers without quotes
10. String values (level, variant, text, title) must be strings with quotes
11. For Heading component, level MUST be a string: "h1", "h2", "h3", "h4", "h5", or "h6"
12. For Text component, variant MUST be a string: "p", "h1", "h2", "h3", "h4", "h5", or "h6"
13. Return ONLY valid JSON, no explanations or markdown

Generate the layout now:`;
}

/**
 * Build prompt for component content generation
 */
function buildContentPrompt(componentType, context, businessType) {
  const prompts = {
    Hero: `Generate Hero section content for a ${businessType}. Context: ${context}
    
Return JSON:
{
  "title": "Compelling headline (max 60 chars)",
  "subtitle": "Engaging description (max 120 chars)",
  "ctaText": "Action button text (max 20 chars)",
  "ctaLink": "#contact"
}`,

    Features: `Generate 3-4 feature items for a ${businessType}. Context: ${context}

Return JSON:
{
  "heading": "Section title",
  "items": [
    {
      "icon": "⚡",
      "title": "Feature name",
      "description": "Brief description"
    }
  ]
}`,

    CTA: `Generate call-to-action content for a ${businessType}. Context: ${context}

Return JSON:
{
  "title": "Compelling CTA headline",
  "description": "Supporting text",
  "buttonText": "Action text",
  "buttonLink": "#contact"
}`,

    Text: `Generate paragraph content for a ${businessType}. Context: ${context}

Return JSON:
{
  "content": "Professional paragraph text (2-3 sentences)"
}`,

    Heading: `Generate section heading for a ${businessType}. Context: ${context}

Return JSON:
{
  "text": "Section heading"
}`
  };

  return prompts[componentType] || `Generate content for ${componentType} component. Return valid JSON only.`;
}

/**
 * Sanitize AI-generated layout to fix common issues
 */
function sanitizeLayout(layout) {
  if (!layout || !layout.containers) return layout;

  layout.containers.forEach(container => {
    container.columns?.forEach(column => {
      column.components?.forEach(component => {
        // Fix Heading component - ensure level is a string
        if (component.type === 'Heading' && component.props) {
          if (typeof component.props.level === 'number') {
            component.props.level = `h${component.props.level}`;
          }
          if (!component.props.level || !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(component.props.level)) {
            component.props.level = 'h2';
          }
        }

        // Fix Text component - ensure variant is a string
        if (component.type === 'Text' && component.props) {
          if (typeof component.props.variant === 'number') {
            component.props.variant = `h${component.props.variant}`;
          }
          if (!component.props.variant) {
            component.props.variant = 'p';
          }
        }

        // Fix Button component - ensure variant is valid
        if (component.type === 'Button' && component.props) {
          if (!['primary', 'secondary', 'outline'].includes(component.props.variant)) {
            component.props.variant = 'primary';
          }
        }

        // Ensure all numeric style values are numbers
        if (component.styles) {
          ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom'].forEach(key => {
            if (component.styles[key] && typeof component.styles[key] === 'string') {
              component.styles[key] = parseInt(component.styles[key]) || 0;
            }
          });
        }

        // Ensure all props are defined
        if (!component.props) {
          component.props = {};
        }
        if (!component.styles) {
          component.styles = {};
        }
      });
    });
  });

  return layout;
}

/**
 * Validate layout structure
 */
function validateLayout(layout) {
  if (!layout || !layout.containers || !Array.isArray(layout.containers)) {
    throw new Error('Invalid layout structure: missing containers array');
  }

  layout.containers.forEach((container, idx) => {
    if (!container.id || !container.type) {
      throw new Error(`Container ${idx}: missing id or type`);
    }
    
    if (!container.columns || !Array.isArray(container.columns)) {
      throw new Error(`Container ${container.id}: missing columns array`);
    }

    container.columns.forEach((column, colIdx) => {
      if (!column.id || typeof column.width !== 'number') {
        throw new Error(`Container ${container.id}, column ${colIdx}: invalid structure`);
      }

      if (!column.components || !Array.isArray(column.components)) {
        throw new Error(`Container ${container.id}, column ${column.id}: missing components array`);
      }

      column.components.forEach((component, compIdx) => {
        if (!component.id || !component.type) {
          throw new Error(`Container ${container.id}, column ${column.id}, component ${compIdx}: missing id or type`);
        }
      });
    });
  });

  return true;
}

/**
 * Fallback layouts for common business types
 */
function getFallbackLayout(businessType, pageType) {
  const fallbacks = {
    restaurant: [
      {
        id: 'container-1',
        type: 'container',
        settings: { direction: 'horizontal', contentWidth: 'boxed', maxWidth: 1280, gap: 16 },
        styles: { backgroundColor: '#ffffff', paddingTop: 60, paddingBottom: 60 },
        columns: [{
          id: 'col-1',
          width: 12,
          components: [{
            id: 'hero-1',
            type: 'Hero',
            props: {
              title: 'Welcome to Our Restaurant',
              subtitle: 'Experience culinary excellence',
              ctaText: 'View Menu',
              ctaLink: '#menu'
            },
            styles: { backgroundColor: '#f3f4f6', paddingTop: 80, paddingBottom: 80 }
          }]
        }]
      }
    ],
    gym: [
      {
        id: 'container-1',
        type: 'container',
        settings: { direction: 'horizontal', contentWidth: 'boxed', maxWidth: 1280, gap: 16 },
        styles: { backgroundColor: '#ffffff', paddingTop: 60, paddingBottom: 60 },
        columns: [{
          id: 'col-1',
          width: 12,
          components: [{
            id: 'hero-1',
            type: 'Hero',
            props: {
              title: 'Transform Your Body',
              subtitle: 'Join our fitness community today',
              ctaText: 'Start Free Trial',
              ctaLink: '#signup'
            },
            styles: { backgroundColor: '#1f2937', textColor: '#ffffff', paddingTop: 80, paddingBottom: 80 }
          }]
        }]
      }
    ]
  };

  return fallbacks[businessType.toLowerCase()] || fallbacks.restaurant;
}
