import { useState, type FormEvent } from 'react';
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
  
  const { shapes, addShape, updateShape, deleteShape, alignShapes, distributeShapes } = useCanvasContext();
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
      const operations: CanvasOperations = {
        createShape: async (type: string, position: { x: number; y: number }, properties: any) => {
          console.log('[AIInput] Creating shape:', type, position, properties);
          // addShape doesn't return ID, but creates shape in Firestore
          // We generate a temporary ID for tracking
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          await addShape(type as any, position);
          // Note: The actual shape will have a different ID assigned by Firestore
          // For now, return temp ID for AI response tracking
          return tempId;
        },
        
        updateShape: async (shapeId: string, updates: any) => {
          console.log('[AIInput] Updating shape:', shapeId, updates);
          await updateShape(shapeId, updates);
        },
        
        deleteShape: async (shapeId: string) => {
          console.log('[AIInput] Deleting shape:', shapeId);
          await deleteShape(shapeId);
        },
        
        alignShapes: async (shapeIds: string[], alignType: string) => {
          console.log('[AIInput] Aligning shapes:', shapeIds, alignType);
          await alignShapes(alignType as 'left' | 'right' | 'centerH' | 'top' | 'centerV' | 'bottom');
        },
        
        distributeShapes: async (shapeIds: string[], direction: string) => {
          console.log('[AIInput] Distributing shapes:', shapeIds, direction);
          await distributeShapes(direction as 'horizontal' | 'vertical');
        }
      };
      
      // Run AI agent
      console.log('[AIInput] Running AI agent with command:', command);
      const result = await runAIAgent(command, shapes, operations);
      
      if (result.error) {
        toast.error(result.error);
        setLastResult(`Error: ${result.error}`);
      } else {
        const summary = `Created ${result.shapesCreated.length} shape(s), modified ${result.shapesModified.length} shape(s)`;
        toast.success(summary);
        setLastResult(result.interpretation || summary);
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
    'Create a red circle at center',
    'Make 3 blue rectangles',
    'Create a login form',
    'Align them horizontally'
  ];

  const fillExample = (cmd: string) => {
    setCommand(cmd);
  };

  return (
    <div className="ai-input-container fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl px-4">
      {/* Results Display */}
      {lastResult && (
        <div className="mb-2 glass-strong rounded-lg p-3 text-sm text-gray-700 animate-fadeIn">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div className="flex-1">
              <span className="font-medium text-purple-700">AI: </span>
              {lastResult}
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
      <form onSubmit={handleSubmit} className="glass-strong rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center p-4 space-x-3">
          {/* AI Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ask AI: 'Create a red circle' or 'Make a login form'..."
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50"
            aria-label="AI command input"
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={loading || !command.trim()}
            className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
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
        
        {/* Example Commands */}
        {!loading && command.length === 0 && (
          <div className="px-4 pb-3 pt-1 border-t border-gray-200">
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
      
      {/* Powered by Claude badge */}
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500">
          Powered by <span className="font-semibold text-purple-600">Claude AI</span>
        </span>
      </div>
    </div>
  );
}

export default AIInput;

