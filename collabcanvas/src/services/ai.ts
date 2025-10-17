/**
 * AI Canvas Agent Service
 * Integrates OpenAI GPT-4 for natural language canvas design
 */

import OpenAI from 'openai';
import type { Shape } from '../utils/types';

// Initialize OpenAI client
// Note: API key must be in .env as VITE_OPENAI_API_KEY
const getClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.\n' +
      'Get your API key from: https://platform.openai.com'
    );
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side use
  });
};

/**
 * Canvas tool definitions for OpenAI function calling
 */
export interface CanvasTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * All available tools for the AI agent
 */
const tools: CanvasTool[] = [
  {
    type: 'function',
    function: {
      name: 'createShape',
      description: 'Create a new shape on the canvas. Use this to add rectangles, circles, text, or lines. Unless the user specifies a location, use the viewport center coordinates provided in the system message. You can call this multiple times to create multiple shapes.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line'],
            description: 'The type of shape to create'
          },
          x: {
            type: 'number',
            description: 'X position on canvas (use viewport center from system message by default, range 0-5000)'
          },
          y: {
            type: 'number',
            description: 'Y position on canvas (use viewport center from system message by default, range 0-5000)'
          },
          fill: {
            type: 'string',
            description: 'Fill color as hex code (e.g., "#FF0000" for red)'
          },
          width: {
            type: 'number',
            description: 'Width in pixels (for rectangles, default 100)'
          },
          height: {
            type: 'number',
            description: 'Height in pixels (for rectangles, default 100)'
          },
          radius: {
            type: 'number',
            description: 'Radius in pixels (for circles, default 50)'
          },
          text: {
            type: 'string',
            description: 'Text content (for text shapes)'
          },
          fontSize: {
            type: 'number',
            description: 'Font size in pixels (for text, default 16)'
          }
        },
        required: ['type', 'x', 'y']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'updateShape',
      description: 'Update properties of an existing shape (change color, position, size, etc.)',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to update'
          },
          fill: {
            type: 'string',
            description: 'New fill color (hex code)'
          },
          x: {
            type: 'number',
            description: 'New X position'
          },
          y: {
            type: 'number',
            description: 'New Y position'
          },
          width: {
            type: 'number',
            description: 'New width'
          },
          height: {
            type: 'number',
            description: 'New height'
          }
        },
        required: ['shapeId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deleteShape',
      description: 'Delete a shape from the canvas',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to delete'
          }
        },
        required: ['shapeId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'alignShapes',
      description: 'Align multiple shapes relative to each other',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to align'
          },
          alignment: {
            type: 'string',
            enum: ['left', 'right', 'top', 'bottom', 'centerH', 'centerV'],
            description: 'Alignment type: left, right, top, bottom, centerH (horizontal center), centerV (vertical center)'
          }
        },
        required: ['shapeIds', 'alignment']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'distributeShapes',
      description: 'Distribute multiple shapes evenly with equal spacing',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to distribute'
          },
          direction: {
            type: 'string',
            enum: ['horizontal', 'vertical'],
            description: 'Distribution direction'
          }
        },
        required: ['shapeIds', 'direction']
      }
    }
  }
];

/**
 * Canvas operations interface
 */
export interface CanvasOperations {
  createShape: (type: string, position: { x: number; y: number }, properties: any) => Promise<string>;
  updateShape: (shapeId: string, updates: any) => Promise<void>;
  deleteShape: (shapeId: string) => Promise<void>;
  alignShapes: (shapeIds: string[], alignType: string) => Promise<void>;
  distributeShapes: (shapeIds: string[], direction: string) => Promise<void>;
}

/**
 * Result of AI agent execution
 */
export interface AIAgentResult {
  interpretation: string;
  shapesCreated: string[];
  shapesModified: string[];
  error?: string;
}

/**
 * Execute a function call from OpenAI
 */
async function executeFunctionCall(
  functionName: string,
  functionArgs: any,
  operations: CanvasOperations
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`[AI] Executing function: ${functionName}`, functionArgs);
    
    switch (functionName) {
      case 'createShape': {
        const { type, x, y, fill, width, height, radius, text, fontSize } = functionArgs;
        const properties: any = { fill: fill || '#cccccc' };
        
        if (type === 'rectangle') {
          properties.width = width || 100;
          properties.height = height || 100;
        } else if (type === 'circle') {
          properties.radius = radius || 50;
        } else if (type === 'text') {
          properties.text = text || 'Text';
          properties.fontSize = fontSize || 16;
        }
        
        console.log(`[AI] Creating ${type} at (${x}, ${y}) with properties:`, properties);
        const shapeId = await operations.createShape(type, { x, y }, properties);
        console.log(`[AI] Shape created with ID: ${shapeId}`);
        return { success: true, result: shapeId };
      }
      
      case 'updateShape': {
        const { shapeId, ...updates } = functionArgs;
        await operations.updateShape(shapeId, updates);
        return { success: true };
      }
      
      case 'deleteShape': {
        await operations.deleteShape(functionArgs.shapeId);
        return { success: true };
      }
      
      case 'alignShapes': {
        await operations.alignShapes(functionArgs.shapeIds, functionArgs.alignment);
        return { success: true };
      }
      
      case 'distributeShapes': {
        await operations.distributeShapes(functionArgs.shapeIds, functionArgs.direction);
        return { success: true };
      }
      
      default:
        return { success: false, error: `Unknown function: ${functionName}` };
    }
  } catch (error) {
    console.error(`[AI] Function execution error:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Run the AI agent with a user command
 * 
 * @param userCommand - Natural language command from user
 * @param canvasState - Current shapes on canvas (for context)
 * @param operations - Canvas operations interface
 * @param viewportCenter - Current center of the user's viewport (for default positioning)
 * @returns Result of AI execution
 */
export async function runAIAgent(
  userCommand: string,
  canvasState: Shape[],
  operations: CanvasOperations,
  viewportCenter: { x: number; y: number } = { x: 2500, y: 2500 }
): Promise<AIAgentResult> {
  const result: AIAgentResult = {
    interpretation: '',
    shapesCreated: [],
    shapesModified: []
  };
  
  try {
    const client = getClient();
    
    // Build detailed shape list for AI context
    const shapesList = canvasState.length > 0 
      ? canvasState.map(shape => {
          const details = `  - ID: ${shape.id}, Type: ${shape.type}, Position: (${Math.round(shape.x)}, ${Math.round(shape.y)}), Fill: ${shape.fill || 'none'}`;
          if (shape.type === 'text' && shape.text) {
            return details + `, Text: "${shape.text}"`;
          }
          return details;
        }).join('\n')
      : '  (no shapes on canvas)';

    // Build context about current canvas
    const canvasContext = `
You are an AI assistant that helps users design on a canvas by creating and manipulating shapes.

Current canvas state:
- Canvas size: 5000x5000 pixels
- User's viewport center: (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
- Number of shapes: ${canvasState.length}
- Available shape types: rectangle, circle, text, line

Shapes currently on canvas:
${shapesList}

Guidelines for creating shapes:
- You can create multiple shapes in a single response by calling createShape multiple times
- Maximum 50 shapes per request - if user requests more, politely decline and ask them to request 50 or fewer
- Unless the user specifies a location, create shapes near the viewport center: (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
- When creating multiple shapes, position them close together within the viewport unless user specifies otherwise
- Arrange shapes logically based on shape type and quantity (horizontal line, vertical stack, or grid)
- Vary properties (colors, sizes) based on the prompt context - don't make all shapes identical unless specified
- Use reasonable spacing between elements (let shapes touch if specified, otherwise 20-100px gaps)
- Keep shapes within canvas bounds (0-5000 for x and y)
- For forms or UI layouts, align elements properly
- Use readable font sizes (16-24px for text)
- Use appropriate colors (avoid pure black/white, use hex codes)

Guidelines for modifying shapes:
- When user says "all rectangles" or "all circles", identify shapes by type from the list above
- When user says "the red circle" or "the blue rectangle", identify by color and type
- For bulk modifications (e.g., "make all rectangles red"), call updateShape once for each matching shape
- You can update multiple shapes at once - updateShape calls will execute in parallel efficiently
- Common color names to hex codes: red=#EF4444, blue=#3B82F6, green=#10B981, purple=#8B5CF6, yellow=#F59E0B, orange=#F97316, pink=#EC4899
- "Aggie maroon" = #500000 (Texas A&M maroon)

User command: ${userCommand}

Please use the available tools to fulfill the user's request. Identify shapes from the canvas state above.
    `.trim();
    
    console.log('[AI] Sending request to OpenAI...');
    
    // Call OpenAI with tools (supports parallel function calling)
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that creates and manipulates shapes on a canvas based on user commands. Always use the provided tools to perform canvas operations. You can call createShape multiple times to create multiple shapes at once.'
        },
        {
          role: 'user',
          content: canvasContext
        }
      ],
      tools: tools,
      tool_choice: 'auto',
      parallel_tool_calls: true,
      temperature: 0.7,
      max_tokens: 2000
    });
    
    console.log('[AI] OpenAI response:', response);
    
    const message = response.choices[0].message;
    
    // Extract interpretation from message content
    if (message.content) {
      result.interpretation = message.content;
    }
    
    // Execute tool calls (supports multiple tool calls)
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(`[AI] Processing ${message.tool_calls.length} tool calls`);
      
      // Group tool calls by type - all must execute sequentially to avoid Firestore race condition
      // (All operations modify the same shapes array in the canvas document)
      const allCalls: Array<{ name: string; args: any }> = [];
      
      message.tool_calls.forEach((toolCall) => {
        // Type guard: only process if it's a function tool call
        if ('function' in toolCall && toolCall.function) {
          const { name, arguments: argsString } = toolCall.function;
          const functionArgs = JSON.parse(argsString);
          allCalls.push({ name, args: functionArgs });
        }
      });
      
      // Execute all calls sequentially to avoid Firestore race condition
      // (Multiple parallel writes to same document's shapes array cause last-write-wins issue)
      console.log(`[AI] Executing ${allCalls.length} operations sequentially to avoid race conditions`);
      for (const { name, args } of allCalls) {
        console.log(`[AI] Executing: ${name}`, args);
        const execResult = await executeFunctionCall(name, args, operations);
        
        if (execResult.success) {
          if (name === 'createShape' && execResult.result) {
            result.shapesCreated.push(execResult.result);
          } else if (name === 'updateShape' || name === 'deleteShape') {
            result.shapesModified.push(args.shapeId);
          }
        } else {
          console.error(`[AI] Tool execution failed for ${name}:`, execResult.error);
        }
      }
    }
    
    console.log(`[AI] Complete: ${result.shapesCreated.length} created, ${result.shapesModified.length} modified`);
    
    return result;
    
  } catch (error: any) {
    console.error('[AI] Agent error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      result.error = 'OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.';
    } else if (error.status === 401) {
      result.error = 'Invalid API key. Please check your OpenAI API key in .env file.';
    } else if (error.status === 429) {
      result.error = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.code === 'insufficient_quota') {
      result.error = 'OpenAI quota exceeded. Please check your billing at platform.openai.com.';
    } else {
      result.error = `AI agent error: ${error.message || 'Unknown error'}`;
    }
    
    return result;
  }
}
