import { useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { runAIAgent, type CanvasOperations } from '../../services/ai';

/**
 * AI Input Component
 * Allows users to send natural language commands to the AI agent
 */
export function AIInput() {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { shapes, addShape, updateShape, deleteShape, alignShapes, distributeShapes, addConnection, stageRef } = useCanvasContext();
  const { currentUser } = useAuth();
  const toast = useToast();

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!command.trim() || loading) return;
    
    if (!currentUser) {
      toast.error('You must be logged in to use the AI agent');
      return;
    }

    setLoading(true);
    setLastResult('');
    
    try {
      // Create operations interface
      // Track shape creation order to map IDs
      const shapeCreationOrder: string[] = [];
      
      const operations: CanvasOperations = {
        createShape: async (type: string, position: { x: number; y: number }, properties: any) => {
          const shapeId = await addShape(type as any, position, properties);
          shapeCreationOrder.push(shapeId);
          return shapeId;
        },
        
        updateShape: async (shapeId: string, updates: any) => {
          await updateShape(shapeId, updates);
        },
        
        deleteShape: async (shapeId: string) => {
          await deleteShape(shapeId);
        },
        
        alignShapes: async (_shapeIds: string[], alignType: string) => {
          await alignShapes(alignType as 'left' | 'right' | 'centerH' | 'top' | 'centerV' | 'bottom');
        },
        
        distributeShapes: async (_shapeIds: string[], direction: string) => {
          await distributeShapes(direction as 'horizontal' | 'vertical');
        },
        
        createConnection: async (fromShapeId: string, toShapeId: string, options: any) => {
          const connectionId = await addConnection({
            fromShapeId,
            toShapeId,
            fromAnchor: options.fromAnchor || 'right',
            toAnchor: options.toAnchor || 'left',
            arrowType: options.arrowType || 'end',
            label: options.label,
            createdBy: currentUser!.uid,
          });
          return connectionId;
        }
      };
      
      // Calculate viewport center in canvas coordinates
      const stage = stageRef?.current;
      let viewportCenter = { x: 2500, y: 2500 };
      
      if (stage) {
        const viewportCenterScreen = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
        
        viewportCenter = {
          x: (viewportCenterScreen.x - stage.x()) / stage.scaleX(),
          y: (viewportCenterScreen.y - stage.y()) / stage.scaleY()
        };
      }
      
      const result = await runAIAgent(command, shapes, operations, viewportCenter);
      
      if (result.error) {
        toast.error(result.error);
        setLastResult(`Error: ${result.error}`);
      } else {
        // Generate detailed summary of created shapes
        let detailedSummary = '';
        
        if (result.shapeDetails.length > 0) {
          // Group shapes by type and color for cleaner summary
          const shapeGroups = new Map<string, number>();
          result.shapeDetails.forEach(shape => {
            const key = `${shape.type}|${shape.fill}`;
            shapeGroups.set(key, (shapeGroups.get(key) || 0) + 1);
          });
          
          // Format shape type names for display
          const formatShapeType = (type: string): string => {
            const typeMap: Record<string, string> = {
              'rectangle': 'Rectangle',
              'circle': 'Circle',
              'text': 'Text',
              'line': 'Line',
              'process': 'Process Box',
              'decision': 'Decision Diamond',
              'startEnd': 'Start/End Oval',
              'document': 'Document',
              'database': 'Database',
              'triangle': 'Triangle',
              'rightTriangle': 'Right Triangle',
              'hexagon': 'Hexagon',
              'octagon': 'Octagon',
              'ellipse': 'Ellipse',
              'button': 'Button',
              'textInput': 'Text Input',
              'textarea': 'Textarea',
              'dropdown': 'Dropdown',
              'checkbox': 'Checkbox',
              'radio': 'Radio',
              'toggle': 'Toggle',
              'slider': 'Slider'
            };
            return typeMap[type] || type;
          };
          
          // Build summary lines
          const summaryLines: string[] = [];
          shapeGroups.forEach((count, key) => {
            const [type, fill] = key.split('|');
            const shapeName = formatShapeType(type);
            const plural = count > 1 ? 's' : '';
            summaryLines.push(`- ${count} ${shapeName}${plural} (${fill.toUpperCase()})`);
          });
          
          detailedSummary = summaryLines.join('\n');
        }
        
        // Add connections info if any
        if (result.connectionsCreated.length > 0) {
          detailedSummary += `\n- ${result.connectionsCreated.length} Connection${result.connectionsCreated.length > 1 ? 's' : ''}`;
        }
        
        // Display detailed summary as toast
        if (detailedSummary) {
          toast.success(detailedSummary, { duration: 5000 }); // Longer duration for detailed info
        } else {
          toast.success('Operation completed');
        }
        
        setLastResult(result.interpretation || detailedSummary || 'Operation completed');
        setCommand(''); // Clear input on success
      }
      
    } catch (error: any) {
      console.error('[AIInput] Error:', error);
      const errorMsg = error.message || 'Failed to execute AI command';
      toast.error(errorMsg);
      setLastResult(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Example commands for quick testing
   */
  const exampleCommands = [
    'Create 5 colorful circles',
    'Make all rectangles blue',
    'Create a login form',
    'Design code, write code, test code, deploy code',
    'If tests pass deploy, if not send email',
    'Start, fetch from database, validate data, save to database, end'
  ];

  const fillExample = (cmd: string) => {
    setCommand(cmd);
  };

  // Keep expanded if user is typing or has content
  const shouldExpand = isExpanded || command.length > 0 || loading || lastResult.length > 0;

  return (
    <div 
      className="ai-input-container fixed bottom-4 left-4 z-10 transition-all duration-300 ease-in-out"
      style={{
        width: shouldExpand ? '42rem' : 'auto',
        maxWidth: '42rem',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Results Display */}
      {lastResult && (
        <div className="mb-2 glass-strong rounded-lg p-3 text-sm text-gray-700 animate-fadeIn">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="flex-1 prose prose-sm prose-purple max-w-none">
              <span className="font-medium text-purple-700">AI: </span>
              <ReactMarkdown
                components={{
                  // Custom styles for markdown elements
                  p: ({children, ...props}) => <p className="inline" {...props}>{children}</p>,
                  ul: ({children, ...props}) => <ul className="list-disc list-inside my-1" {...props}>{children}</ul>,
                  ol: ({children, ...props}) => <ol className="list-decimal list-inside my-1" {...props}>{children}</ol>,
                  li: ({children, ...props}) => <li className="my-0.5" {...props}>{children}</li>,
                  strong: ({children, ...props}) => <strong className="font-semibold text-purple-800" {...props}>{children}</strong>,
                  em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                  code: ({children, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>,
                  h1: ({children, ...props}) => <h1 className="text-base font-bold my-1" {...props}>{children}</h1>,
                  h2: ({children, ...props}) => <h2 className="text-sm font-bold my-1" {...props}>{children}</h2>,
                  h3: ({children, ...props}) => <h3 className="text-sm font-semibold my-1" {...props}>{children}</h3>,
                }}
              >
                {lastResult}
              </ReactMarkdown>
            </div>
            <button
              onClick={() => setLastResult('')}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="glass-strong rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out">
        <div className="flex items-center" style={{ 
          padding: shouldExpand ? '1rem' : '0.75rem',
          gap: shouldExpand ? '0.75rem' : '0' 
        }}>
          {/* AI Icon - Sparkles/Stars to indicate AI */}
          <div className="flex-shrink-0 relative group">
            <div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer relative"
              style={{
                animation: !shouldExpand ? 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
              }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                {/* Sparkles icon - commonly associated with AI */}
                <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
                <path d="M19 3L19.75 5.75L22.5 6.5L19.75 7.25L19 10L18.25 7.25L15.5 6.5L18.25 5.75L19 3Z" />
                <path d="M5 14L5.75 16.75L8.5 17.5L5.75 18.25L5 21L4.25 18.25L1.5 17.5L4.25 16.75L5 14Z" />
              </svg>
              {/* AI Badge - only visible when minimized */}
              {!shouldExpand && (
                <div className="absolute -bottom-1 -right-1 bg-white text-purple-600 text-[9px] font-bold px-1 py-0.5 rounded shadow-md">
                  AI
                </div>
              )}
            </div>
            {/* Tooltip when minimized */}
            {!shouldExpand && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                Canvas AI Assistant
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
          
          {/* Input Field - Hidden when minimized */}
          <div 
            className="flex-1 transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              width: shouldExpand ? '100%' : '0',
              opacity: shouldExpand ? 1 : 0,
            }}
          >
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Ask AI: 'Create 5 circles', 'Make all rectangles red', etc..."
              disabled={loading}
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50"
              aria-label="AI command input"
            />
          </div>
          
          {/* Send Button - Hidden when minimized */}
          <div
            className="flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
            style={{
              width: shouldExpand ? 'auto' : '0',
              opacity: shouldExpand ? 1 : 0,
            }}
          >
            <button
              type="submit"
              disabled={loading || !command.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap"
              aria-label="Send AI command"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Thinking...</span>
                </div>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
        
        {/* Example Commands - Only shown when expanded */}
        {shouldExpand && !loading && command.length === 0 && (
          <div className="px-4 pb-3 pt-1 border-t border-gray-200 animate-fadeIn">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Try:</span>
              {exampleCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillExample(cmd)}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
      
      {/* Powered by OpenAI badge - Only shown when expanded */}
      {shouldExpand && (
        <div className="text-center mt-2 animate-fadeIn">
          <span className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-purple-600">OpenAI</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default AIInput;

