import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/ai/chat
 * 
 * Process natural language commands and stream AI responses with executable actions.
 * 
 * Request body:
 * - message: User's message
 * - context: { layoutJSON, brandKit, chatHistory, selectedComponentId, pageId }
 * 
 * Response: Streaming text/plain with AI response
 */
export async function POST(request) {
  try {
    const { message, context } = await request.json();

    // Validate required fields
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }

    if (!context || !context.layoutJSON || !context.pageId) {
      return NextResponse.json(
        { error: "Missing required context fields" },
        { status: 400 }
      );
    }

    // Build context-rich prompt
    const prompt = buildChatPrompt(message, context);

    // Configure Gemini model for streaming
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Generate streaming response with timeout
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await model.generateContentStream(prompt);

      // Clear timeout on success
      clearTimeout(timeoutId);

      // Create ReadableStream for response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              controller.enqueue(new TextEncoder().encode(text));
            }
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            
            // Send error message to client
            const errorMessage = "\n\nI encountered an error while processing your request. Please try again.";
            controller.enqueue(new TextEncoder().encode(errorMessage));
            controller.close();
          }
        },
      });

      // Return streaming response
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (streamError) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (streamError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out after 30 seconds" },
          { status: 408 }
        );
      }
      
      throw streamError;
    }
  } catch (error) {
    console.error("Chat API error:", error);

    // Handle rate limiting
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          retryAfter: 60,
        },
        { 
          status: 429,
          headers: {
            "Retry-After": "60",
          },
        }
      );
    }

    // Return error response
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Build context-rich prompt for Gemini
 */
function buildChatPrompt(userMessage, context) {
  const {
    layoutJSON,
    brandKit,
    chatHistory = [],
    selectedComponentId,
  } = context;

  // Analyze current page state
  const currentPage = layoutJSON.pages?.[0];
  const componentCount = countComponents(currentPage?.layout || []);
  const containerCount = currentPage?.layout?.length || 0;

  // Get selected component info
  let selectedComponentInfo = "None";
  if (selectedComponentId) {
    const component = findComponentById(
      currentPage?.layout || [],
      selectedComponentId
    );
    if (component) {
      selectedComponentInfo = `${component.type} (${component.id})`;
    }
  }

  // Format brand kit info
  const brandInfo = brandKit
    ? `
- Primary color: ${brandKit.colors?.primary || "Not set"}
- Secondary color: ${brandKit.colors?.secondary || "Not set"}
- Heading font: ${brandKit.fonts?.heading || "Not set"}
- Body font: ${brandKit.fonts?.body || "Not set"}
- Mood: ${brandKit.mood || "Not set"}`
    : "- No brand kit configured";

  // Format chat history (last 5 messages for context)
  const recentHistory = chatHistory
    .slice(-5)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Available components
  const availableComponents = [
    "Hero",
    "CTA",
    "Features",
    "FormEmbed",
    "Text",
    "Heading",
    "Button",
    "Image",
    "Gallery",
    "Navbar",
    "Footer",
  ];

  return `You are an expert web designer helping build a website. The user is working on "${currentPage?.name || "their page"}".

CURRENT PAGE STATE:
- Total components: ${componentCount}
- Containers: ${containerCount}
- Selected component: ${selectedComponentInfo}

BRAND SETTINGS:
${brandInfo}

AVAILABLE COMPONENTS (ONLY USE THESE):
${availableComponents.join(", ")}

CONVERSATION HISTORY:
${recentHistory || "No previous conversation"}

USER REQUEST: "${userMessage}"

INSTRUCTIONS:
1. Understand the user's intent from their message and conversation history
2. If they reference "this", "it", or "that", use the selected component (${selectedComponentInfo})
3. Generate a friendly, conversational response explaining what you'll do
4. Create specific actions to fulfill the request
5. Only use components from the AVAILABLE COMPONENTS list
6. Apply brand colors and fonts when creating new components
7. If the request is unclear, ask a clarifying question instead of guessing

RESPONSE FORMAT:
Respond in a friendly, conversational way. If you need to perform actions, include them in a JSON block at the END of your response.

Example responses:

User: "Add a hero section"
Your response:
I'll add a hero section at the top of your page with your brand colors.

\`\`\`json
{
  "text": "I'll add a hero section at the top of your page with your brand colors.",
  "actions": [{
    "type": "ADD_COMPONENT",
    "payload": {
      "componentType": "Hero",
      "position": "top",
      "props": {
        "title": "Transform Your Business Today",
        "subtitle": "Discover how our solution can help you achieve your goals",
        "ctaText": "Get Started",
        "ctaLink": "#contact"
      },
      "styles": {
        "backgroundColor": "${brandKit?.colors?.primary || "#f3f4f6"}",
        "textColor": "${brandKit?.colors?.text || "#1f2937"}"
      }
    }
  }],
  "confidence": 0.95
}
\`\`\`

User: "What colors should I use?"
Your response:
Based on your ${brandKit?.mood || "modern"} brand mood, I recommend using ${brandKit?.colors?.primary || "blue"} as your primary color for CTAs and important elements. This creates good contrast and guides users' attention to key actions.

\`\`\`json
{
  "text": "Based on your ${brandKit?.mood || "modern"} brand mood, I recommend using ${brandKit?.colors?.primary || "blue"} as your primary color for CTAs and important elements. This creates good contrast and guides users' attention to key actions.",
  "actions": [],
  "confidence": 0.85
}
\`\`\`

IMPORTANT RULES:
1. Write your conversational response FIRST
2. Then add the JSON block at the END
3. The "text" field in JSON should match your conversational response
4. Use empty actions array [] if no actions needed
5. Only use components from AVAILABLE COMPONENTS list
6. Apply brand colors when creating components
7. Be helpful and friendly

Generate your response now:`;
}

/**
 * Count total components in layout
 */
function countComponents(layout) {
  let count = 0;
  
  if (!Array.isArray(layout)) return 0;

  for (const container of layout) {
    if (container.columns) {
      for (const column of container.columns) {
        if (column.components) {
          count += column.components.length;
        }
      }
    }
  }

  return count;
}

/**
 * Find component by ID in layout
 */
function findComponentById(layout, componentId) {
  if (!Array.isArray(layout)) return null;

  for (const container of layout) {
    if (container.columns) {
      for (const column of container.columns) {
        if (column.components) {
          const component = column.components.find((c) => c.id === componentId);
          if (component) return component;
        }
      }
    }
  }

  return null;
}
