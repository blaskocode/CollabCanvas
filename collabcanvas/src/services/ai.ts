/**
 * AI Canvas Agent Service
 * Integrates Claude API for natural language canvas design
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Shape } from '../utils/types';

// Initialize Anthropic client
// Note: API key must be in .env as VITE_CLAUDE_API_KEY
const getClient = () => {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'Claude API key not found. Please add VITE_CLAUDE_API_KEY to your .env file.\n' +
      'Get your API key from: https://console.anthropic.com'
    );
  }
  
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side use
  });
};

/**
 * Canvas tool definitions for Claude
 */
export interface CanvasTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * All available tools for the AI agent
 */
const tools: CanvasTool[] = [
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas. Use this to add rectangles, circles, text, or lines.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'text', 'line'],
          description: 'The type of shape to create'
        },
        x: {
          type: 'number',
          description: 'X position on canvas (canvas center is 2500, range 0-5000)'
        },
        y: {
          type: 'number',
          description: 'Y position on canvas (canvas center is 2500, range 0-5000)'
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
  },
  {
    name: 'updateShape',
    description: 'Update properties of an existing shape (change color, position, size, etc.)',
    input_schema: {
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
  },
  {
    name: 'deleteShape',
    description: 'Delete a shape from the canvas',
    input_schema: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to delete'
        }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'alignShapes',
    description: 'Align multiple shapes relative to each other',
    input_schema: {
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
  },
  {
    name: 'distributeShapes',
    description: 'Distribute multiple shapes evenly with equal spacing',
    input_schema: {
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
 * Execute a tool call from Claude
 */
async function executeToolCall(
  toolName: string,
  toolInput: any,
  operations: CanvasOperations
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    console.log(`[AI] Executing tool: ${toolName}`, toolInput);
    
    switch (toolName) {
      case 'createShape': {
        const { type, x, y, fill, width, height, radius, text, fontSize } = toolInput;
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
        
        const shapeId = await operations.createShape(type, { x, y }, properties);
        return { success: true, result: shapeId };
      }
      
      case 'updateShape': {
        const { shapeId, ...updates } = toolInput;
        await operations.updateShape(shapeId, updates);
        return { success: true };
      }
      
      case 'deleteShape': {
        await operations.deleteShape(toolInput.shapeId);
        return { success: true };
      }
      
      case 'alignShapes': {
        await operations.alignShapes(toolInput.shapeIds, toolInput.alignment);
        return { success: true };
      }
      
      case 'distributeShapes': {
        await operations.distributeShapes(toolInput.shapeIds, toolInput.direction);
        return { success: true };
      }
      
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`[AI] Tool execution error:`, error);
    return { success: false, error: String(error) };
  }
}

/**
 * Run the AI agent with a user command
 * 
 * @param userCommand - Natural language command from user
 * @param canvasState - Current shapes on canvas (for context)
 * @param operations - Canvas operations interface
 * @returns Result of AI execution
 */
export async function runAIAgent(
  userCommand: string,
  canvasState: Shape[],
  operations: CanvasOperations
): Promise<AIAgentResult> {
  const result: AIAgentResult = {
    interpretation: '',
    shapesCreated: [],
    shapesModified: []
  };
  
  try {
    const client = getClient();
    
    // Build context about current canvas
    const canvasContext = `
Current canvas state:
- Canvas size: 5000x5000 pixels
- Canvas center: (2500, 2500)
- Number of shapes: ${canvasState.length}
- Available shape types: rectangle, circle, text, line

Guidelines:
- Use reasonable spacing (50-100px between elements)
- Keep shapes within canvas bounds (0-5000 for x and y)
- For forms or UI layouts, align elements properly
- Use readable font sizes (16-24px for text)
- Use appropriate colors (avoid pure black/white, use hex codes)
- When creating multiple related elements, position them logically

User command: ${userCommand}
    `.trim();
    
    console.log('[AI] Sending request to Claude...');
    
    // Call Claude with tools
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      tools: tools,
      messages: [
        {
          role: 'user',
          content: canvasContext
        }
      ]
    });
    
    console.log('[AI] Claude response:', message);
    
    // Extract interpretation from text blocks
    const textBlocks = message.content.filter(block => block.type === 'text');
    if (textBlocks.length > 0) {
      result.interpretation = textBlocks.map((block: any) => block.text).join('\n');
    }
    
    // Execute tool calls
    const toolCalls = message.content.filter(block => block.type === 'tool_use');
    
    for (const toolCall of toolCalls) {
      const { name, input } = toolCall as any;
      console.log(`[AI] Executing: ${name}`, input);
      
      const execResult = await executeToolCall(name, input, operations);
      
      if (execResult.success) {
        if (name === 'createShape' && execResult.result) {
          result.shapesCreated.push(execResult.result);
        } else if (name === 'updateShape' || name === 'deleteShape') {
          result.shapesModified.push(input.shapeId);
        }
      } else {
        console.error(`[AI] Tool execution failed:`, execResult.error);
      }
    }
    
    console.log(`[AI] Complete: ${result.shapesCreated.length} created, ${result.shapesModified.length} modified`);
    
    return result;
    
  } catch (error: any) {
    console.error('[AI] Agent error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      result.error = 'Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file.';
    } else if (error.status === 401) {
      result.error = 'Invalid API key. Please check your Claude API key in .env file.';
    } else if (error.status === 429) {
      result.error = 'Rate limit exceeded. Please wait a moment and try again.';
    } else {
      result.error = `AI agent error: ${error.message || 'Unknown error'}`;
    }
    
    return result;
  }
}

