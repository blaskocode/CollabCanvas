import React, { useState, useEffect, useRef, useCallback } from 'react';
import ColorPicker from '../UI/ColorPicker';
import type { Shape, Connection } from '../../utils/types';
import { getTimeAgo } from '../../utils/timeHelpers';
import { usePresence } from '../../hooks/usePresence';
import { useAuth } from '../../hooks/useAuth';

interface PropertyPanelProps {
  shape: Shape | null;
  connection: Connection | null;
  onUpdate: (updates: Partial<Shape>) => void;
  onUpdateConnection: (updates: Partial<Connection>) => void;
}

/**
 * PropertyPanel Component
 * Floating panel for editing shape and connection styling properties
 * Shows when a shape or connection is selected
 * 
 * @param props - PropertyPanel properties
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ shape, connection, onUpdate, onUpdateConnection }) => {
  // Get presence data for display names
  const { currentUser } = useAuth();
  const { onlineUsers } = usePresence(
    currentUser?.uid || null,
    currentUser?.displayName || currentUser?.email || null,
    !!currentUser
  );
  
  // Local state for real-time preview
  const [fillColor, setFillColor] = useState(shape?.fill || '#cccccc');
  const [strokeColor, setStrokeColor] = useState(shape?.stroke || '#000000');
  const [strokeEnabled, setStrokeEnabled] = useState(!!shape?.stroke);
  const [strokeWidth, setStrokeWidth] = useState(shape?.strokeWidth || 2);
  const [opacity, setOpacity] = useState(shape?.opacity || 100);
  const [cornerRadius, setCornerRadius] = useState(shape?.cornerRadius || 0);

  // Connection-specific state
  const [arrowStart, setArrowStart] = useState(false);
  const [arrowEnd, setArrowEnd] = useState(false);
  const [lineStrokeColor, setLineStrokeColor] = useState('#000000');
  const [lineStrokeWidth, setLineStrokeWidth] = useState(2);

  // Debounce timer refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Get display name for last editor
  const getDisplayName = (userId: string): string => {
    if (userId === currentUser?.uid) {
      return 'You';
    }
    const user = onlineUsers.find(u => u.userId === userId);
    if (user) {
      return user.displayName;
    }
    // Fallback: try to get from currentUser if it matches
    if (currentUser && currentUser.uid === userId) {
      return currentUser.displayName || currentUser.email?.split('@')[0] || 'You';
    }
    return 'Unknown user';
  };

  // Update local state when shape changes
  useEffect(() => {
    if (shape) {
      setFillColor(shape.fill);
      setStrokeColor(shape.stroke || '#000000');
      setStrokeEnabled(!!shape.stroke);
      setStrokeWidth(shape.strokeWidth || 2);
      setOpacity(shape.opacity || 100);
      setCornerRadius(shape.cornerRadius || 0);
    }
  }, [shape?.id]); // Only reset when shape ID changes

  // Update local state when connection changes
  useEffect(() => {
    if (connection) {
      // Handle both new (arrowStart/arrowEnd) and legacy (arrowType) properties
      let hasArrowStart = false;
      let hasArrowEnd = false;
      
      // Check if using new format (explicit arrowStart/arrowEnd)
      if (connection.arrowStart !== undefined || connection.arrowEnd !== undefined) {
        // New format: use explicit values (default to false if not set)
        hasArrowStart = connection.arrowStart === true;
        hasArrowEnd = connection.arrowEnd === true;
      } else if (connection.arrowType !== undefined) {
        // Legacy format: use arrowType (note: 'start' doesn't exist in ArrowType, only 'both')
        hasArrowStart = connection.arrowType === 'both';
        hasArrowEnd = connection.arrowType === 'end' || connection.arrowType === 'both';
      } else {
        // No arrow properties set: default to end arrow only (legacy behavior)
        hasArrowStart = false;
        hasArrowEnd = true;
      }
      
      setArrowStart(hasArrowStart);
      setArrowEnd(hasArrowEnd);
      setLineStrokeColor(connection.stroke || '#000000');
      setLineStrokeWidth(connection.strokeWidth || 2);
    }
  }, [connection]); // Watch the entire connection object for any changes

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced update function for sliders (300ms delay)
  const debouncedUpdate = useCallback((updates: Partial<Shape>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onUpdate(updates);
    }, 300);
  }, [onUpdate]);

  // Debounced update function for connection sliders (300ms delay)
  const debouncedConnectionUpdate = useCallback((updates: Partial<Connection>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onUpdateConnection(updates);
    }, 300);
  }, [onUpdateConnection]);

  // If no shape and no connection selected, don't render
  if (!shape && !connection) {
    return null;
  }

  // Handle fill color change with immediate preview
  const handleFillChange = (color: string) => {
    setFillColor(color);
    onUpdate({ fill: color });
  };

  // Handle stroke color change
  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    if (strokeEnabled) {
      onUpdate({ stroke: color });
    }
  };

  // Handle stroke toggle
  const handleStrokeToggle = () => {
    const newEnabled = !strokeEnabled;
    setStrokeEnabled(newEnabled);
    onUpdate({ stroke: newEnabled ? strokeColor : undefined });
  };

  // Handle stroke width change (debounced for sliders)
  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    if (strokeEnabled) {
      debouncedUpdate({ strokeWidth: width });
    }
  };

  // Handle opacity change (debounced for sliders)
  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    debouncedUpdate({ opacity: value });
  };

  // Handle corner radius change (debounced for sliders)
  const handleCornerRadiusChange = (value: number) => {
    setCornerRadius(value);
    debouncedUpdate({ cornerRadius: value });
  };

  // Connection handlers
  const handleArrowStartToggle = () => {
    if (!connection) return;
    
    const newValue = !arrowStart;
    setArrowStart(newValue);
    
    // Send both arrow states to properly override legacy arrowType
    // Use local state for the other arrow (source of truth for the UI)
    onUpdateConnection({ 
      arrowStart: newValue,
      arrowEnd: arrowEnd, // Use local state
      arrowType: undefined // Clear legacy arrowType
    });
  };

  const handleArrowEndToggle = () => {
    if (!connection) return;
    
    const newValue = !arrowEnd;
    setArrowEnd(newValue);
    
    // Send both arrow states to properly override legacy arrowType
    // Use local state for the other arrow (source of truth for the UI)
    onUpdateConnection({ 
      arrowStart: arrowStart, // Use local state
      arrowEnd: newValue,
      arrowType: undefined // Clear legacy arrowType
    });
  };

  const handleLineStrokeColorChange = (color: string) => {
    setLineStrokeColor(color);
    onUpdateConnection({ stroke: color });
  };

  const handleLineStrokeWidthChange = (width: number) => {
    setLineStrokeWidth(width);
    debouncedConnectionUpdate({ strokeWidth: width });
  };

  const isRectangle = shape?.type === 'rectangle';
  const isText = shape?.type === 'text';

  return (
    <div 
      className="fixed top-20 left-4 glass-strong rounded-2xl shadow-2xl p-5 space-y-4 z-10 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden transform hover:scale-105 transition-all duration-300 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      role="region"
      aria-label="Shape properties"
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-3 px-4 shadow-md">
        <div className="text-xs font-medium opacity-90">
          {connection ? 'Connection Properties' : 'Shape Properties'}
        </div>
        <div className="text-lg font-bold capitalize">
          {connection ? 'Line / Arrow' : shape?.type}
        </div>
      </div>

      {/* Last Edited By Indicator */}
      {((shape?.lastModifiedBy && shape?.lastModifiedAt) || (connection?.lastModifiedBy && connection?.lastModifiedAt)) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-600 mb-1">Last edited by:</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              {getDisplayName((shape?.lastModifiedBy || connection?.lastModifiedBy)!)}
            </span>
            <span className="text-xs text-gray-500">
              {(() => {
                const timestamp = shape?.lastModifiedAt || connection?.lastModifiedAt;
                if (!timestamp) return getTimeAgo(Date.now());
                if (typeof timestamp === 'number') return getTimeAgo(timestamp);
                return getTimeAgo((timestamp as any).toMillis?.() || Date.now());
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Shape-specific Controls */}
      {shape && (
        <>
          {/* Fill Color */}
          <div>
            <ColorPicker
              label="Fill Color"
              value={fillColor}
              onChange={handleFillChange}
            />
          </div>

          {/* Stroke (Border) Controls - Hidden for text shapes */}
          {!isText && (
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-700">
            Border
          </label>
          <button
            onClick={handleStrokeToggle}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              strokeEnabled
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {strokeEnabled ? 'On' : 'Off'}
          </button>
        </div>
        
        {strokeEnabled && (
          <>
            <ColorPicker
              label="Border Color"
              value={strokeColor}
              onChange={handleStrokeColorChange}
            />
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 block">
                Border Width: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </>
        )}
        </div>
      )}

      {/* Opacity Slider */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700 block">
          Opacity: {opacity}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* Transform Properties Display */}
      {(shape.rotation !== undefined && shape.rotation !== 0) || 
       (shape.scaleX !== undefined && shape.scaleX !== 1) || 
       (shape.scaleY !== undefined && shape.scaleY !== 1) ? (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-700">Transform</div>
          
          {shape.rotation !== undefined && shape.rotation !== 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Rotation:</span>
              <span className="font-medium text-gray-800">
                {Math.round(shape.rotation)}°
              </span>
            </div>
          )}
          
          {(shape.scaleX !== undefined && shape.scaleX !== 1) || 
           (shape.scaleY !== undefined && shape.scaleY !== 1) ? (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Scale:</span>
              <span className="font-medium text-gray-800">
                {shape.scaleX?.toFixed(2) || 1} × {shape.scaleY?.toFixed(2) || 1}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

          {/* Corner Radius (Rectangles only) */}
          {isRectangle && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 block">
                Corner Radius: {cornerRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={cornerRadius}
                onChange={(e) => handleCornerRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          )}
        </>
      )}

      {/* Connection-specific Controls */}
      {connection && (
        <>
          {/* Arrow Configuration */}
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700">Arrow Configuration</div>
            
            {/* Arrow Start */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Start Arrow
              </label>
              <button
                onClick={handleArrowStartToggle}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  arrowStart
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle start arrow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </button>
            </div>

            {/* Arrow End */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                End Arrow
              </label>
              <button
                onClick={handleArrowEndToggle}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  arrowEnd
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle end arrow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Line Color */}
          <div>
            <ColorPicker
              label="Line Color"
              value={lineStrokeColor}
              onChange={handleLineStrokeColorChange}
            />
          </div>

          {/* Line Width */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 block">
              Line Width: {lineStrokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={lineStrokeWidth}
              onChange={(e) => handleLineStrokeWidthChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </>
      )}

      {/* Preview indicator */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Changes sync in real-time
      </div>
    </div>
  );
};

export default PropertyPanel;

