import React, { useRef, useState, useEffect, useCallback } from 'react';
import { hexToHsv, hsvToRgb, rgbToHex, hexToRgb, getHueColor, type HSV, type RGB } from '../../utils/colorUtils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

/**
 * Custom ColorPicker Component with HSV gradient picker
 * Provides real-time color selection with hue slider, saturation/brightness gradient, and RGB inputs
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [rgb, setRgb] = useState<RGB>(() => hexToRgb(value));
  const [hexInput, setHexInput] = useState(value.toUpperCase());
  
  const gradientRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isDraggingGradient, setIsDraggingGradient] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);

  // Update internal state when value prop changes from parent
  useEffect(() => {
    const newHsv = hexToHsv(value);
    const newRgb = hexToRgb(value);
    setHsv(newHsv);
    setRgb(newRgb);
    setHexInput(value.toUpperCase());
  }, [value]);

  // Update color from HSV and notify parent
  const updateColorFromHsv = useCallback((newHsv: HSV) => {
    setHsv(newHsv);
    const newRgb = hsvToRgb(newHsv);
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb);
    setHexInput(newHex);
    onChange(newHex);
  }, [onChange]);

  // Handle gradient (saturation/brightness) interaction
  const handleGradientInteraction = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientRef.current || disabled) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;

    updateColorFromHsv({ ...hsv, s, v });
  }, [hsv, updateColorFromHsv, disabled]);

  // Handle hue slider interaction
  const handleHueInteraction = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current || disabled) return;

    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const h = (x / rect.width) * 360;

    updateColorFromHsv({ ...hsv, h });
  }, [hsv, updateColorFromHsv, disabled]);

  // Mouse event handlers for gradient
  const handleGradientMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingGradient(true);
    handleGradientInteraction(e);
  };

  // Mouse event handlers for hue slider
  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingHue(true);
    handleHueInteraction(e);
  };

  // Global mouse handlers for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingGradient && gradientRef.current) {
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        const s = (x / rect.width) * 100;
        const v = 100 - (y / rect.height) * 100;
        updateColorFromHsv({ ...hsv, s, v });
      }
      
      if (isDraggingHue && hueRef.current) {
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const h = (x / rect.width) * 360;
        updateColorFromHsv({ ...hsv, h });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingGradient(false);
      setIsDraggingHue(false);
    };

    if (isDraggingGradient || isDraggingHue) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingGradient, isDraggingHue, hsv, updateColorFromHsv]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the color swatch or hex input
        const target = e.target as HTMLElement;
        if (!target.closest('.color-picker-trigger')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let hex = e.target.value.toUpperCase();
    
    if (hex.length > 0 && !hex.startsWith('#')) {
      hex = '#' + hex;
    }
    
    setHexInput(hex);
    
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      const newHsv = hexToHsv(hex);
      const newRgb = hexToRgb(hex);
      setHsv(newHsv);
      setRgb(newRgb);
      onChange(hex);
    }
  };

  // Handle RGB input changes
  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgb, [channel]: numValue };
    setRgb(newRgb);
    
    const newHex = rgbToHex(newRgb);
    const newHsv = hexToHsv(newHex);
    setHsv(newHsv);
    setHexInput(newHex);
    onChange(newHex);
  };

  // Calculate gradient selector position
  const gradientSelectorX = (hsv.s / 100) * 100;
  const gradientSelectorY = (1 - hsv.v / 100) * 100;

  // Calculate hue selector position
  const hueSelectorX = (hsv.h / 360) * 100;

  const currentHueColor = getHueColor(hsv.h);

  return (
    <div className="relative space-y-2">
      <label className="text-xs font-medium text-gray-700 block">
        {label}
      </label>
      
      <div 
        className="flex items-stretch gap-2 color-picker-trigger cursor-pointer"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {/* Color swatch preview - larger and more prominent */}
        <div
          className="w-16 h-16 rounded-xl border-2 border-gray-300 shadow-md hover:shadow-lg hover:scale-105 transition-all flex-shrink-0"
          style={{ backgroundColor: value }}
          title={value}
        />
        
        {/* Hex value display and input - larger box */}
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            onClick={(e) => e.stopPropagation()}
            placeholder="#000000"
            maxLength={7}
            disabled={disabled}
            className="w-full px-4 py-4 text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-center"
          />
        </div>
      </div>

      {/* Custom Color Picker Panel */}
      {isOpen && !disabled && (
        <div 
          ref={pickerRef}
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 space-y-3 w-80"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-700">Color Picker</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Hex input inside picker */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Hex Color</label>
            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              placeholder="#000000"
              maxLength={7}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Saturation/Brightness Gradient */}
          <div
            ref={gradientRef}
            className="relative w-full h-48 rounded-lg cursor-crosshair overflow-hidden shadow-inner"
            style={{
              background: `linear-gradient(to bottom, transparent, black),
                          linear-gradient(to right, white, ${currentHueColor})`,
            }}
            onMouseDown={handleGradientMouseDown}
          >
            {/* Selector dot */}
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${gradientSelectorX}%`,
                top: `${gradientSelectorY}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: value,
              }}
            />
          </div>

          {/* Hue Slider */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Hue</label>
            <div
              ref={hueRef}
              className="relative w-full h-8 rounded-lg cursor-pointer overflow-hidden shadow-inner"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}
              onMouseDown={handleHueMouseDown}
            >
              {/* Hue selector */}
              <div
                className="absolute w-1 h-full bg-white border border-gray-800 shadow-lg pointer-events-none"
                style={{
                  left: `${hueSelectorX}%`,
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          </div>

          {/* RGB Inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700 block text-center mb-1">R</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block text-center mb-1">G</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block text-center mb-1">B</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
