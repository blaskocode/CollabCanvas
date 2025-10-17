import React from 'react';
import { MAX_ZOOM } from '../../utils/constants';
import type { ShapeType } from '../../utils/types';

interface CanvasControlsProps {
  zoom: number;
  minZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onResetZoom: () => void;
  onAddShape: (type: ShapeType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearAll?: () => void;
  isDrawingMode?: boolean;
  drawingShapeType?: ShapeType | null;
  isPlacementMode?: boolean;
  placementShapeType?: ShapeType | null;
}

/**
 * CanvasControls Component
 * Floating control panel for canvas operations
 * Displays zoom level and provides buttons for zoom, reset, and adding shapes
 */
const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  minZoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onResetZoom,
  onAddShape,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onClearAll,
  isDrawingMode = false,
  drawingShapeType = null,
  isPlacementMode = false,
  placementShapeType = null,
}) => {
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > minZoom;

  return (
    <div 
      className="fixed top-20 right-4 glass-strong rounded-2xl shadow-2xl p-5 space-y-3 z-10 min-w-[180px] max-h-[calc(100vh-100px)] overflow-y-auto transform hover:scale-105 transition-all duration-300"
      role="toolbar"
      aria-label="Canvas controls"
    >
      {/* Undo/Redo Controls */}
      {(onUndo || onRedo) && (
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-1"
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-xs">Undo</span>
          </button>
          
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-1"
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
            <span className="text-xs">Redo</span>
          </button>
        </div>
      )}
      
      {/* Clear All Button */}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          title="Clear All (Ctrl+Shift+Delete)"
          aria-label="Clear all shapes from canvas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear All</span>
        </button>
      )}
      
      {/* Zoom Level Display */}
      <div 
        className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 px-4 shadow-md cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 select-none"
        onDoubleClick={onResetZoom}
        title="Double-click to reset to 100%"
        aria-live="polite"
        aria-atomic="true"
        role="button"
        tabIndex={0}
      >
        <div className="text-xs font-medium opacity-90">Zoom Level</div>
        <div className="text-2xl font-bold">{Math.round(zoom * 100)}%</div>
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <button
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          title="Zoom In"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          <span>Zoom In</span>
        </button>

        <button
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
          <span>Zoom Out</span>
        </button>

        <button
          onClick={onResetView}
          className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          title="Reset View"
          aria-label="Reset view to center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset View</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gradient-to-r from-transparent via-gray-300 to-transparent" role="separator"></div>

      {/* Shape Type Selector - Click to immediately enter drawing mode */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600 text-center">
          {isDrawingMode ? 'Drawing...' : 'Select Shape to Draw'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddShape('rectangle')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isDrawingMode && drawingShapeType === 'rectangle'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title="Draw Rectangle"
            aria-label="Draw rectangle shape"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="6" width="16" height="12" strokeWidth={2} rx="2" />
            </svg>
            <span className="text-xs">Rectangle</span>
          </button>
          
          <button
            onClick={() => onAddShape('circle')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isDrawingMode && drawingShapeType === 'circle'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title="Draw Circle"
            aria-label="Draw circle shape"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" strokeWidth={2} />
            </svg>
            <span className="text-xs">Circle</span>
          </button>
          
          <button
            onClick={() => onAddShape('text')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isDrawingMode && drawingShapeType === 'text'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title="Draw Text"
            aria-label="Draw text shape"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-xs">Text</span>
          </button>
          
          <button
            onClick={() => onAddShape('line')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isDrawingMode && drawingShapeType === 'line'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title="Draw Line"
            aria-label="Draw line shape"
          >
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="4" y1="18" x2="20" y2="6" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <span className="text-xs">Line</span>
          </button>
        </div>
        
        {/* Workflow Shapes Section */}
        <div className="text-xs font-medium text-gray-600 text-center mt-4 mb-2">
          Workflow Shapes
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddShape('process')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isPlacementMode && placementShapeType === 'process'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            title="Process Box - Workflow step"
            aria-label="Draw process box shape"
          >
            <div className="text-2xl">📦</div>
            <span className="text-xs">Process</span>
          </button>
          
          <button
            onClick={() => onAddShape('decision')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isPlacementMode && placementShapeType === 'decision'
                ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300'
                : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
            }`}
            title="Decision Diamond - Yes/No branching"
            aria-label="Draw decision diamond shape"
          >
            <div className="text-2xl">♦️</div>
            <span className="text-xs">Decision</span>
          </button>
          
          <button
            onClick={() => onAddShape('startEnd')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isPlacementMode && placementShapeType === 'startEnd'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300'
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            title="Start/End Oval"
            aria-label="Draw start/end oval shape"
          >
            <div className="text-2xl">⭕</div>
            <span className="text-xs">Start/End</span>
          </button>
          
          <button
            onClick={() => onAddShape('document')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              isPlacementMode && placementShapeType === 'document'
                ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-300'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            title="Document"
            aria-label="Draw document shape"
          >
            <div className="text-2xl">📄</div>
            <span className="text-xs">Document</span>
          </button>
          
          <button
            onClick={() => onAddShape('database')}
            className={`p-2 rounded-lg border-2 transition-all duration-200 col-span-2 ${
              isPlacementMode && placementShapeType === 'database'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            }`}
            title="Database"
            aria-label="Draw database shape"
          >
            <div className="text-2xl">🗄️</div>
            <span className="text-xs">Database</span>
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div 
        className="text-xs text-gray-600 text-center pt-3 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent space-y-1"
        role="separator"
      >
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
          <span className="font-medium">Drag to pan</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="font-medium">Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasControls;

