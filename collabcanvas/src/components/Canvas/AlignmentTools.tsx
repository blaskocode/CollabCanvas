import React from 'react';

interface AlignmentToolsProps {
  selectedCount: number;
  onAlign: (type: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  hasGroupedShapes?: boolean;
}

/**
 * AlignmentTools Component
 * Shows alignment, distribution, and grouping tools when multiple shapes are selected
 */
const AlignmentTools: React.FC<AlignmentToolsProps> = ({
  selectedCount,
  onAlign,
  onDistribute,
  onGroup,
  onUngroup,
  hasGroupedShapes = false,
}) => {
  if (selectedCount < 1) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 flex flex-col gap-2 z-50">
      <div className="text-xs text-gray-500 font-medium mb-1">
        {selectedCount} shapes selected
      </div>
      
      {/* Horizontal Alignment */}
      <div className="flex gap-1">
        <button
          onClick={() => onAlign('left')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Left"
        >
          ⫿ Left
        </button>
        <button
          onClick={() => onAlign('centerH')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Center Horizontal"
        >
          ⊞ Center
        </button>
        <button
          onClick={() => onAlign('right')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Right"
        >
          ⫾ Right
        </button>
      </div>
      
      {/* Vertical Alignment */}
      <div className="flex gap-1">
        <button
          onClick={() => onAlign('top')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Top"
        >
          ⫴ Top
        </button>
        <button
          onClick={() => onAlign('centerV')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Center Vertical"
        >
          ⊞ Middle
        </button>
        <button
          onClick={() => onAlign('bottom')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition-colors"
          title="Align Bottom"
        >
          ⫵ Bottom
        </button>
      </div>
      
      {/* Distribution */}
      {selectedCount >= 3 && (
        <div className="border-t pt-2 mt-1 flex gap-1">
          <button
            onClick={() => onDistribute('horizontal')}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
            title="Distribute Horizontally"
          >
            ⟷ Distribute H
          </button>
          <button
            onClick={() => onDistribute('vertical')}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
            title="Distribute Vertically"
          >
            ⟷ Distribute V
          </button>
        </div>
      )}
      
      {/* Grouping */}
      <div className="border-t pt-2 mt-1 flex gap-1">
        {selectedCount >= 2 && onGroup && (
          <button
            onClick={onGroup}
            className="flex-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs font-medium transition-colors"
            title="Group Shapes (Ctrl+G)"
          >
            ⊞ Group
          </button>
        )}
        {hasGroupedShapes && onUngroup && (
          <button
            onClick={onUngroup}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
            title="Ungroup Shapes (Ctrl+Shift+G)"
          >
            ⊟ Ungroup
          </button>
        )}
      </div>
    </div>
  );
};

export default AlignmentTools;

