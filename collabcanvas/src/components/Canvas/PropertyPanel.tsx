import React, { useState, useEffect, useRef, useCallback } from 'react';
import ColorPicker from '../UI/ColorPicker';
import type { Shape } from '../../utils/types';

interface PropertyPanelProps {
  shape: Shape | null;
  onUpdate: (updates: Partial<Shape>) => void;
}

/**
 * PropertyPanel Component
 * Floating panel for editing shape styling properties
 * Shows when a shape is selected
 * 
 * @param props - PropertyPanel properties
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ shape, onUpdate }) => {
  // Local state for real-time preview
  const [fillColor, setFillColor] = useState(shape?.fill || '#cccccc');
  const [strokeColor, setStrokeColor] = useState(shape?.stroke || '#000000');
  const [strokeEnabled, setStrokeEnabled] = useState(!!shape?.stroke);
  const [strokeWidth, setStrokeWidth] = useState(shape?.strokeWidth || 2);
  const [opacity, setOpacity] = useState(shape?.opacity || 100);
  const [cornerRadius, setCornerRadius] = useState(shape?.cornerRadius || 0);

  // Debounce timer refs
  const debounceTimerRef = useRef<number | null>(null);

  // Update local state when shape changes
  useEffect(() => {
    console.log('[PropertyPanel] Shape changed:', shape?.id, shape);
    if (shape) {
      setFillColor(shape.fill);
      setStrokeColor(shape.stroke || '#000000');
      setStrokeEnabled(!!shape.stroke);
      setStrokeWidth(shape.strokeWidth || 2);
      setOpacity(shape.opacity || 100);
      setCornerRadius(shape.cornerRadius || 0);
    }
  }, [shape?.id]); // Only reset when shape ID changes

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

  // If no shape selected, don't render
  if (!shape) {
    return null;
  }

  // Handle fill color change with immediate preview
  const handleFillChange = (color: string) => {
    console.log('[PropertyPanel] Fill color changed:', color);
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

  const isRectangle = shape.type === 'rectangle';

  return (
    <div 
      className="fixed top-20 left-4 glass-strong rounded-2xl shadow-2xl p-5 space-y-4 z-10 w-64 transform hover:scale-105 transition-all duration-300"
      role="region"
      aria-label="Shape properties"
      onClick={(e) => {
        console.log('[PropertyPanel] Panel clicked, stopping propagation');
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        console.log('[PropertyPanel] Panel mousedown, stopping propagation');
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-3 px-4 shadow-md">
        <div className="text-xs font-medium opacity-90">Shape Properties</div>
        <div className="text-lg font-bold capitalize">{shape.type}</div>
      </div>

      {/* Fill Color */}
      <div>
        <ColorPicker
          label="Fill Color"
          value={fillColor}
          onChange={handleFillChange}
        />
      </div>

      {/* Stroke (Border) Controls */}
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

      {/* Preview indicator */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Changes sync in real-time
      </div>
    </div>
  );
};

export default PropertyPanel;

