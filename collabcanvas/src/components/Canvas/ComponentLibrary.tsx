import React, { useState } from 'react';
import { useCanvasContext } from '../../contexts/canvas';
import { useToast } from '../../hooks/useToast';

interface ComponentLibraryProps {
  onClose: () => void;
  zIndex?: number;
}

/**
 * ComponentLibrary Component
 * Panel for managing reusable components/symbols
 */
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onClose, zIndex = 40 }) => {
  const { components, selectedIds, createComponent, deleteComponent, insertComponent } = useCanvasContext();
  const toast = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentDescription, setNewComponentDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateComponent = async () => {
    if (!newComponentName.trim()) {
      toast.error('Please enter a component name');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Please select at least one shape to create a component');
      return;
    }

    setIsCreating(true);
    try {
      await createComponent(newComponentName.trim(), newComponentDescription.trim() || undefined);
      toast.success(`Component "${newComponentName}" created`);
      setNewComponentName('');
      setNewComponentDescription('');
      setShowCreateDialog(false);
    } catch (error: any) {
      console.error('Error creating component:', error);
      toast.error(error.message || 'Failed to create component');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInsertComponent = async (componentId: string) => {
    try {
      // Insert at center of viewport (position calculated automatically)
      await insertComponent(componentId);
      toast.success('Component inserted');
    } catch (error: any) {
      console.error('Error inserting component:', error);
      toast.error('Failed to insert component');
    }
  };

  const handleDeleteComponent = async (componentId: string, componentName: string) => {
    if (window.confirm(`Delete component "${componentName}"?`)) {
      try {
        await deleteComponent(componentId);
        toast.success(`Component "${componentName}" deleted`);
      } catch (error: any) {
        console.error('Error deleting component:', error);
        toast.error('Failed to delete component');
      }
    }
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 flex flex-col" style={{ zIndex }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Components</span>
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close component library"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Create Component Button */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          disabled={selectedIds.length === 0}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all shadow-md ${
            selectedIds.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
          }`}
          title={selectedIds.length === 0 ? 'Select shapes to create a component' : 'Create component from selection'}
        >
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Component</span>
          </span>
        </button>
        
        {selectedIds.length > 0 && (
          <p className="text-xs text-gray-600 mt-2 text-center">
            {selectedIds.length} shape{selectedIds.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="p-4 bg-purple-50 border-b border-purple-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Component Name *</label>
              <input
                type="text"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                placeholder="e.g., Button, Icon, Header"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateComponent();
                  if (e.key === 'Escape') setShowCreateDialog(false);
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={newComponentDescription}
                onChange={(e) => setNewComponentDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateComponent}
                disabled={isCreating || !newComponentName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {components.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 font-medium mb-2">No Components Yet</p>
            <p className="text-sm text-gray-400">
              Select shapes and create your first reusable component
            </p>
          </div>
        ) : (
          components.map((component) => (
            <div
              key={component.id}
              className="group bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{component.name}</h3>
                  {component.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{component.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {component.shapes.length} shape{component.shapes.length > 1 ? 's' : ''} • {Math.round(component.width)} × {Math.round(component.height)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleInsertComponent(component.id)}
                  className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-1.5 px-3 rounded text-xs font-semibold transition-colors"
                >
                  Insert
                </button>
                <button
                  onClick={() => handleDeleteComponent(component.id, component.name)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-3 rounded text-xs font-semibold transition-colors"
                  title="Delete component"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;

