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
      description: 'Create a new shape on the canvas. ALL 22 shape types are fully supported and functional. When a user asks for ANY shape type in the enum below (including hexagon, triangle, octagon, ellipse, or form elements), you MUST create it - NEVER say it is unavailable. Unless the user specifies a location, use the viewport center coordinates provided in the system message. You can call this multiple times to create multiple shapes. ⚠️ IMPORTANT: If creating workflow shapes that are part of a sequence or flow, you MUST also call createConnection to link them together after creating all shapes.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['rectangle', 'circle', 'text', 'line', 'process', 'decision', 'startEnd', 'document', 'database', 'triangle', 'rightTriangle', 'hexagon', 'octagon', 'ellipse', 'textInput', 'textarea', 'dropdown', 'radio', 'checkbox', 'button', 'toggle', 'slider'],
            description: 'The type of shape to create. BASIC: rectangle, circle, text, line. WORKFLOW: process (process steps), decision (yes/no branches), startEnd (start/end ovals), document (reports/forms), database (data storage). GEOMETRIC: triangle, rightTriangle, hexagon, octagon, ellipse. FORM ELEMENTS: button, textInput, textarea, dropdown, checkbox, radio, toggle, slider'
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
      description: '🔗 **CRITICAL FOR WORKFLOWS**: Create arrows between shapes. When you create process, decision, startEnd, database, or document shapes, you MUST call this function to connect them. Workflows without connections are INCOMPLETE. This function creates visual arrows that show the flow between steps.',
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
      description: 'Update properties of an existing shape. Use this for move, resize, rotate, and style commands.',
      parameters: {
        type: 'object',
        properties: {
          shapeId: {
            type: 'string',
            description: 'ID of the shape to update'
          },
          fill: {
            type: 'string',
            description: 'New fill color as hex code (e.g., "#FF0000")'
          },
          x: {
            type: 'number',
            description: 'New X position (for "move" commands)'
          },
          y: {
            type: 'number',
            description: 'New Y position (for "move" commands)'
          },
          width: {
            type: 'number',
            description: 'New width in pixels (for "resize" commands on rectangles)'
          },
          height: {
            type: 'number',
            description: 'New height in pixels (for "resize" commands on rectangles)'
          },
          radius: {
            type: 'number',
            description: 'New radius in pixels (for "resize" commands on circles)'
          },
          rotation: {
            type: 'number',
            description: 'Rotation angle in degrees, 0-360 (for "rotate" commands)'
          },
          text: {
            type: 'string',
            description: 'New text content (for text shapes)'
          },
          fontSize: {
            type: 'number',
            description: 'New font size in pixels (for text shapes)'
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
  },
  {
    type: 'function',
    function: {
      name: 'spaceElementsEvenly',
      description: 'Space multiple shapes evenly in a horizontal row, maintaining their relative order.',
      parameters: {
        type: 'object',
        properties: {
          shapeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of shape IDs to space evenly'
          },
          margin: {
            type: 'number',
            description: 'Margin in pixels between shapes (default: 20)'
          },
          rowWidth: {
            type: 'number',
            description: 'Maximum width of the row (default: 500)'
          },
          shapes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'ID of the shape' },
                width: { type: 'number', description: 'Width of the shape' },
                height: { type: 'number', description: 'Height of the shape' }
              },
              required: ['id', 'width', 'height']
            },
            description: 'Array of shape objects with their current dimensions'
          }
        },
        required: ['shapeIds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createForm',
      description: 'Create a login form with username and password input boxes.',
      parameters: {
        type: 'object',
        properties: {
          formType: {
            type: 'string',
            enum: ['login'],
            description: 'Type of form to create (e.g., "login")'
          },
          x: {
            type: 'number',
            description: 'X position on canvas (use viewport center from system message by default, range 0-5000)'
          },
          y: {
            type: 'number',
            description: 'Y position on canvas (use viewport center from system message by default, range 0-5000)'
          }
        },
        required: ['formType', 'x', 'y']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createNavbar',
      description: 'Create a navigation bar with configurable items.',
      parameters: {
        type: 'object',
        properties: {
          x: {
            type: 'number',
            description: 'X position on canvas (use viewport center from system message by default, range 0-5000)'
          },
          y: {
            type: 'number',
            description: 'Y position on canvas (use viewport center from system message by default, range 0-5000)'
          },
          itemWidth: {
            type: 'number',
            description: 'Width of each navigation item (default: 100)'
          },
          itemHeight: {
            type: 'number',
            description: 'Height of each navigation item (default: 40)'
          },
          items: {
            type: 'array',
            items: {
              type: 'string',
              description: 'Name of the navigation item'
            },
            description: 'Array of navigation item names'
          }
        },
        required: ['x', 'y', 'items']
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
 * Detailed shape information for summary
 */
export interface ShapeDetail {
  id: string;
  type: string;
  fill: string;
}

/**
 * Result of AI agent execution
 */
export interface AIAgentResult {
  interpretation: string;
  shapesCreated: string[];
  shapeDetails: ShapeDetail[]; // Detailed information for summary toast
  shapesModified: string[];
  connectionsCreated: string[];
  error?: string;
}

async function executeFunctionCall(name, args, operations) {
  const result = { success: false };
  const defaultColor = '#D3D3D3'; // Default color for shapes

  try {
    switch (name) {
      case 'createShape': {
        // Implement configurable text for button
        if (args.type === 'button') {
          const { x, y, width, height, fill } = args;
          const properties = {
            text: args.text || 'Submit', // Allow text customization
            width: width || 100,
            height: height || 50,
            fill: fill || defaultColor
          };
          const shapeId = await operations.createShape('button', { x, y }, properties);
          result.success = true;
          result.shapeId = shapeId;
          break;
        }
        // Handle 3x3 grid creation
        if (args.type === 'rectangle' && args.command === 'createGrid' && args.gridSize) {
          const gridSize = args.gridSize || 3; // Default to 3x3 if not specified
          const sideLength = args.size || 100; // Default size for each square
          const margin = args.margin || 20; // Default margin between squares
          const startX = args.x || 0;
          const startY = args.y || 0;

          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              const x = startX + col * (sideLength + margin);
              const y = startY + row * (sideLength + margin);
              await operations.createShape('rectangle', { x, y }, { width: sideLength, height: sideLength, fill: args.fill || defaultColor });
            }
          }
          result.success = true;
        } else {
          const { type, x, y, fill, width, height, radius, text, fontSize } = args;
          const properties = { fill: fill || defaultColor, width, height, radius, text, fontSize };
          const shapeId = await operations.createShape(type, { x, y }, properties);
          result.success = true;
          result.shapeId = shapeId;
        }
        break;
      }
      case 'updateShape': {
        await operations.updateShape(args.shapeId, args);
        result.success = true;
        break;
      }
      case 'alignShapes': {
        await operations.alignShapes(args.shapeIds, args.alignment);
        result.success = true;
        break;
      }
      case 'distributeShapes': {
        if (args.direction === 'horizontal') {
          await operations.distributeShapes(args.shapeIds, direction);
          result.success = true;
        }
        break;
      }
      case 'spaceElementsEvenly': {
        const shapeIds = args.shapeIds || [];
        if (shapeIds.length > 1) {
          // Assume horizontal rows placement
          const margin = args.margin || 20;
          const rowWidth = args.rowWidth || 500;

          let currentX = 0;
          let currentY = 0;
          const updates: { id: string; x: number; y: number }[] = [];

          shapeIds.forEach((shapeId) => {
            const shape = args.shapes.find(s => s.id === shapeId);
            if (!shape) return;

            const shapeWidth = shape.width || 100;  // Fallback to default sizes
            const shapeHeight = shape.height || 100;

            // Check if new row is needed
            if (currentX + shapeWidth > rowWidth) {
              currentX = 0; // reset X for new row
              currentY += shapeHeight + margin; // move to next row
            }

            updates.push({ id: shapeId, x: currentX, y: currentY });

            // Increment X for next shape
            currentX += shapeWidth + margin;
          });

          // Apply updates
          for (const update of updates) {
            await operations.updateShape(update.id, { x: update.x, y: update.y });
          }

          result.success = true;
        }
        break;
      }
      case 'createForm': {
        // Special case for creating a login form with titled inputs
        if (args.formType === 'login') {
          const startX = args.x || 0;
          const startY = args.y || 0;
          const spacing = 50; // Space between inputs and titles

          // Create Username Title
          await operations.createShape('text', { x: startX, y: startY }, { text: 'Username', fontSize: 14 });
          // Create Username Input Box
          await operations.createShape('textInput', { x: startX, y: startY + spacing }, { width: 200, height: 30 });

          // Create Password Title
          await operations.createShape('text', { x: startX, y: startY + spacing * 2 }, { text: 'Password', fontSize: 14 });
          // Create Password Input Box
          await operations.createShape('textInput', { x: startX, y: startY + spacing * 3 }, { width: 200, height: 30 });

          // Create Submit Button
          await operations.createShape('button', { x: startX, y: startY + spacing * 4 }, { text: 'Submit', width: 100, height: 40 });

          result.success = true;
        }
        break;
      }
      case 'createNavbar': {
        const startX = args.x || 0;
        const startY = args.y || 0;
        const itemWidth = args.itemWidth || 100;
        const itemHeight = args.itemHeight || 40;
        const defaultItems = ['Home', 'About', 'Services', 'Contact'];
        const items = args.items.length > 0 ? args.items : defaultItems;
        const spacing = 10;

        for (const [index, item] of items.entries()) {
          const x = startX + index * (itemWidth + spacing);
          const y = startY;
          await operations.createShape('rectangle', { x, y }, { width: itemWidth, height: itemHeight, fill: '#FFFFFF', text: item });
        }

        result.success = true;
        break;
      }
      case 'createConnection': {
        const connectionId = await operations.createConnection(
          args.fromShapeId,
          args.toShapeId,
          {
            fromAnchor: args.fromAnchor || 'right',
            toAnchor: args.toAnchor || 'left',
            arrowType: args.arrowType || 'end',
            label: args.label
          }
        );
        result.success = true;
        result.connectionId = connectionId;
        break;
      }
      default:
        throw new Error(`Unhandled command: ${name}`);
    }
  } catch (error) {
    console.error(`[AI] Command execution error:`, error);
    result.error = String(error);
  }
  return result;
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
    shapeDetails: [],
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
      model: 'gpt-4o-mini',
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
        // Enhanced shape selection logic
        if ('function' in toolCall && toolCall.function) {
            const { name, arguments: argsString } = toolCall.function;
            const functionArgs = JSON.parse(argsString);

            // Ensure unique shape target using shape ID
            if (name === 'updateShape' && !functionArgs.shapeId) {
                const targetShapes = canvasState.filter(shape => 
                    shape.type === functionArgs.type && 
                    shape.fill === functionArgs.fill &&
                    Math.round(shape.x) === Math.round(viewportCenter.x) &&
                    Math.round(shape.y) === Math.round(viewportCenter.y)
                );

                // If multiple targets, require user confirmation
                if (targetShapes.length > 1) {
                    // Placeholder for potential user feedback integration
                    console.warn('Multiple matching shapes found:', targetShapes);
                } else if (targetShapes.length === 1) {
                    functionArgs.shapeId = targetShapes[0].id;
                }
            }

            allCalls.push({ name, args: functionArgs });
        }
      });
      
      for (const { name, args } of allCalls) {
        const execResult = await executeFunctionCall(name, args, operations);
        
        if (execResult.success) {
          if (name === 'createShape' && execResult.shapeId) {
            result.shapesCreated.push(execResult.shapeId);
            // Track shape details for summary
            if (args.type && args.fill) {
              result.shapeDetails.push({
                id: execResult.shapeId,
                type: args.type,
                fill: args.fill
              });
            }
            if (args.type && workflowShapeTypes.includes(args.type)) {
              hasWorkflowShapes = true;
            }
          } else if (name === 'createConnection' && execResult.connectionId) {
            result.connectionsCreated.push(execResult.connectionId);
          } else if (name === 'updateShape' || name === 'deleteShape') {
            result.shapesModified.push(args.shapeId);
          }

          // Handle horizontal row arrangement with distributeShapes
          if (name === 'distributeShapes') {
              const shapeIds = args.shapeIds || [];
              const direction = args.direction || 'horizontal';
              
              if (direction === 'horizontal' && shapeIds.length > 1) {
                  try {
                      await operations.distributeShapes(shapeIds, direction);
                      result.interpretation += '\n\n✓ Arranged shapes in a horizontal row.';
                  } catch (error) {
                      console.error('[AI] Failed to distribute shapes horizontally:', error);
                  }
              }
          }
        }
      }
    }
    
    // Automatic connection fallback for workflows
    if (hasWorkflowShapes && result.shapesCreated.length >= 2 && result.connectionsCreated.length === 0) {
      // Automatically create connections in sequence
      for (let i = 0; i < result.shapesCreated.length - 1; i++) {
        try {
          const connectionId = await operations.createConnection(
            result.shapesCreated[i],
            result.shapesCreated[i + 1],
            { fromAnchor: 'right', toAnchor: 'left', arrowType: 'end' }
          );
          result.connectionsCreated.push(connectionId);
        } catch (error) {
          console.error('[AI] Failed to auto-connect workflow shapes:', error);
        }
      }
      if (result.connectionsCreated.length > 0) {
        result.interpretation = (result.interpretation || '') + '\n\n✓ Auto-connected workflow shapes in sequence.';
      }
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
