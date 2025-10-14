import React from 'react';
import { MAX_ZOOM } from '../../utils/constants';

interface CanvasControlsProps {
  zoom: number;
  minZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onAddShape: () => void;
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
  onAddShape,
}) => {
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > minZoom;

  return (
    <div 
      className="fixed top-20 right-4 bg-white rounded-lg shadow-lg p-4 space-y-3 z-10"
      role="toolbar"
      aria-label="Canvas controls"
    >
      {/* Zoom Level Display */}
      <div 
        className="text-center text-sm font-medium text-gray-700"
        aria-live="polite"
        aria-atomic="true"
      >
        Zoom: {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Controls */}
      <div className="space-y-2">
        <button
          onClick={onZoomIn}
          disabled={!canZoomIn}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Zoom In"
          aria-label="Zoom in"
        >
          <span className="text-lg" aria-hidden="true">+</span> Zoom In
        </button>

        <button
          onClick={onZoomOut}
          disabled={!canZoomOut}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <span className="text-lg" aria-hidden="true">−</span> Zoom Out
        </button>

        <button
          onClick={onResetView}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          title="Reset View"
          aria-label="Reset view to center"
        >
          Reset View
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" role="separator"></div>

      {/* Shape Controls */}
      <div>
        <button
          onClick={onAddShape}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          title="Add Rectangle"
          aria-label="Add new rectangle shape"
        >
          + Add Shape
        </button>
      </div>

      {/* Help Text */}
      <div 
        className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200"
        role="separator"
      >
        <p>Drag to pan</p>
        <p>Scroll to zoom</p>
      </div>
    </div>
  );
};

export default CanvasControls;

