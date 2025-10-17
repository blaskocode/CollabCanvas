/**
 * AI Canvas Agent Service
 * Integrates OpenAI GPT-4 for natural language canvas design
 */

import OpenAI from 'openai';
import type { Shape } from '../utils/types';
import { SYSTEM_PROMPT } from '../utils/ai-prompts';

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
      description: 'Create a new shape on the canvas. Use this to add workflow shapes (process, decision, startEnd, document, database) or basic shapes (rectangles, circles, text, or lines). Unless the user specifies a location, use the viewport center coordinates provided in the system message. You can call this multiple times to create multiple shapes. ⚠️ IMPORTANT: If creating workflow shapes that are part of a sequence or flow, you MUST also call createConnection to link them together after creating all shapes.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line', 'process', 'decision', 'startEnd', 'document', 'database'],
            description: 'The type of shape to create. Workflow shapes: process (process steps), decision (yes/no branches), startEnd (start/end points), document (reports/forms), database (data storage)'
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
            description: 'Text content (for text shapes and workflow shapes)'
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
      name: 'createConnection',
      description: '🔗 REQUIRED FOR WORKFLOWS: Create a connector (arrow) between two shapes in a workflow. Use this to connect process steps, decision branches, etc. The connector will automatically snap to anchor points and maintain the connection when shapes move. You MUST call this after creating workflow shapes that are sequential or related.',
      parameters: {
        type: 'object',
        properties: {
          fromShapeId: {
            type: 'string',
            description: 'ID of the shape to connect from'
          },
          toShapeId: {
            type: 'string',
            description: 'ID of the shape to connect to'
          },
          fromAnchor: {
            type: 'string',
            enum: ['top', 'right', 'bottom', 'left'],
            description: 'Anchor point on source shape (optional, auto-determined if not provided)'
          },
          toAnchor: {
            type: 'string',
            enum: ['top', 'right', 'bottom', 'left'],
            description: 'Anchor point on target shape (optional, auto-determined if not provided)'
          },
          arrowType: {
            type: 'string',
            enum: ['none', 'end', 'both'],
            description: 'Arrow style: none (plain line), end (arrow at destination), both (arrows at both ends). Default: end'
          },
          label: {
            type: 'string',
            description: 'Label for the connection (e.g., "Yes", "No", "Success", "Fail")'
          }
        },
        required: ['fromShapeId', 'toShapeId']
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
  createConnection: (fromShapeId: string, toShapeId: string, options: any) => Promise<string>;
}

/**
 * Result of AI agent execution
 */
export interface AIAgentResult {
  interpretation: string;
  shapesCreated: string[];
  shapesModified: string[];
  connectionsCreated: string[];
  error?: string;
}

/**
 * Execute a function call from OpenAI
 */
async function executeFunctionCall(
  functionName: string,
  functionArgs: any,
  operations: CanvasOperations
): Promise<{ success: boolean; result?: any; error?: string; shapeType?: string }> {
  try {
    switch (functionName) {
      case 'createShape': {
        const { type, x, y, fill, width, height, radius, text, fontSize } = functionArgs;
        const properties: any = {};
        
        if (type === 'rectangle') {
          properties.width = width || 100;
          properties.height = height || 100;
          properties.fill = fill || '#cccccc';
        } else if (type === 'circle') {
          properties.radius = radius || 50;
          properties.fill = fill || '#cccccc';
        } else if (type === 'text') {
          properties.text = text || 'Text';
          properties.fontSize = fontSize || 16;
          properties.fill = fill || '#000000';
        } else if (type === 'process') {
          properties.width = width || 120;
          properties.height = height || 60;
          properties.fill = fill || '#e0e7ff';
          properties.text = text || '';
          properties.fontSize = fontSize || 16;
          properties.cornerRadius = 8;
        } else if (type === 'decision') {
          properties.width = width || 100;
          properties.height = height || 100;
          properties.fill = fill || '#fef3c7';
          properties.text = text || '';
          properties.fontSize = fontSize || 16;
        } else if (type === 'startEnd') {
          properties.width = width || 120;
          properties.height = height || 60;
          properties.fill = fill || '#d1fae5';
          properties.text = text || '';
          properties.fontSize = fontSize || 16;
        } else if (type === 'document') {
          properties.width = width || 100;
          properties.height = height || 80;
          properties.fill = fill || '#f3f4f6';
          properties.text = text || '';
          properties.fontSize = fontSize || 16;
        } else if (type === 'database') {
          properties.width = width || 100;
          properties.height = height || 80;
          properties.fill = fill || '#ede9fe';
          properties.text = text || '';
          properties.fontSize = fontSize || 16;
        }
        
        const shapeId = await operations.createShape(type, { x, y }, properties);
        return { success: true, result: shapeId, shapeType: type };
      }
      
      case 'createConnection': {
        const { fromShapeId, toShapeId, fromAnchor, toAnchor, arrowType, label } = functionArgs;
        
        try {
          const connectionId = await operations.createConnection(fromShapeId, toShapeId, {
            fromAnchor: fromAnchor || 'right',
            toAnchor: toAnchor || 'left',
            arrowType: arrowType || 'end',
            label
          });
          return { success: true, result: connectionId };
        } catch (error) {
          return { success: false, error: String(error) };
        }
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
    shapesModified: [],
    connectionsCreated: []
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
Current canvas state:
- User's viewport center: (${Math.round(viewportCenter.x)}, ${Math.round(viewportCenter.y)})
- Number of shapes: ${canvasState.length}

Shapes currently on canvas:
${shapesList}

User command: ${userCommand}

Please use the available tools to fulfill the user's request. Identify shapes from the canvas state above.
    `.trim();
    
    // Call OpenAI with tools (supports parallel function calling)
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
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
    
    const message = response.choices[0].message;
    
    // Extract interpretation from message content
    if (message.content) {
      result.interpretation = message.content;
    }
    
    // Execute tool calls (supports multiple tool calls)
    const workflowShapeTypes = ['process', 'decision', 'startEnd', 'document', 'database'];
    let hasWorkflowShapes = false;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      const allCalls: Array<{ name: string; args: any }> = [];
      
      message.tool_calls.forEach((toolCall) => {
        if ('function' in toolCall && toolCall.function) {
          const { name, arguments: argsString } = toolCall.function;
          const functionArgs = JSON.parse(argsString);
          allCalls.push({ name, args: functionArgs });
        }
      });
      
      for (const { name, args } of allCalls) {
        const execResult = await executeFunctionCall(name, args, operations);
        
        if (execResult.success) {
          if (name === 'createShape' && execResult.result) {
            result.shapesCreated.push(execResult.result);
            if (execResult.shapeType && workflowShapeTypes.includes(execResult.shapeType)) {
              hasWorkflowShapes = true;
            }
          } else if (name === 'createConnection' && execResult.result) {
            result.connectionsCreated.push(execResult.result);
          } else if (name === 'updateShape' || name === 'deleteShape') {
            result.shapesModified.push(args.shapeId);
          }
        }
      }
    }
    
    if (hasWorkflowShapes && result.shapesCreated.length >= 2 && result.connectionsCreated.length === 0) {
      result.interpretation = (result.interpretation || '') + '\n\n⚠️ Note: I created the shapes but may have missed creating connections between them. You can manually connect them by clicking anchor points, or ask me to "connect these shapes."';
    }
    
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
