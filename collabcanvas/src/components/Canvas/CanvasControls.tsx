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
      className="fixed top-20 right-4 glass-strong rounded-2xl shadow-2xl p-5 space-y-3 z-10 min-w-[180px] transform hover:scale-105 transition-all duration-300"
      role="toolbar"
      aria-label="Canvas controls"
    >
      {/* Zoom Level Display */}
      <div 
        className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 px-4 shadow-md"
        aria-live="polite"
        aria-atomic="true"
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

      {/* Shape Controls */}
      <div>
        <button
          onClick={onAddShape}
          className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2 animate-pulse-glow"
          title="Add Rectangle"
          aria-label="Add new rectangle shape"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Shape</span>
        </button>
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

