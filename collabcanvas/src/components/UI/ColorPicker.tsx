import React, { useRef, useState, useEffect, useCallback } from 'react';
import { hexToHsv, hsvToRgb, rgbToHex, hexToRgb, getHueColor, type HSV, type RGB } from '../../utils/colorUtils';
import type { ColorPalette, RecentColors } from '../../utils/types';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

// LocalStorage keys
const RECENT_COLORS_KEY = 'collabcanvas_recent_colors';
const PALETTES_KEY = 'collabcanvas_color_palettes';
const MAX_RECENT_COLORS = 10;

/**
 * Load recent colors from localStorage
 */
function loadRecentColors(): RecentColors {
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save recent color to localStorage
 */
function saveRecentColor(color: string): void {
  try {
    const recent = loadRecentColors();
    // Remove duplicate if exists
    const filtered = recent.filter(c => c !== color);
    // Add to front
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save recent color:', err);
  }
}

/**
 * Load palettes from localStorage
 */
function loadPalettes(): ColorPalette[] {
  try {
    const stored = localStorage.getItem(PALETTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save palettes to localStorage
 */
function savePalettes(palettes: ColorPalette[]): void {
  try {
    localStorage.setItem(PALETTES_KEY, JSON.stringify(palettes));
  } catch (err) {
    console.error('Failed to save palettes:', err);
  }
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
  
  // Recent colors and palettes
  const [recentColors, setRecentColors] = useState<RecentColors>(() => loadRecentColors());
  const [palettes, setPalettes] = useState<ColorPalette[]>(() => loadPalettes());
  const [newPaletteName, setNewPaletteName] = useState('');
  const [showNewPalette, setShowNewPalette] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);
  const [editingPaletteName, setEditingPaletteName] = useState('');

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
    
    // Save to recent colors
    saveRecentColor(newHex);
    setRecentColors(loadRecentColors());
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
    
    // Save to recent colors
    saveRecentColor(newHex);
    setRecentColors(loadRecentColors());
  };
  
  // Apply color from swatch
  const applyColor = (color: string) => {
    const newHsv = hexToHsv(color);
    const newRgb = hexToRgb(color);
    setHsv(newHsv);
    setRgb(newRgb);
    setHexInput(color);
    onChange(color);
  };
  
  // Create new palette
  const handleCreatePalette = () => {
    if (!newPaletteName.trim()) return;
    
    const newPalette: ColorPalette = {
      id: Date.now().toString(),
      name: newPaletteName.trim(),
      colors: [value], // Start with current color
      createdAt: Date.now(),
    };
    
    const updated = [...palettes, newPalette];
    setPalettes(updated);
    savePalettes(updated);
    setNewPaletteName('');
    setShowNewPalette(false);
  };
  
  // Delete palette
  const handleDeletePalette = (id: string) => {
    const updated = palettes.filter(p => p.id !== id);
    setPalettes(updated);
    savePalettes(updated);
  };
  
  // Rename palette
  const handleRenamePalette = (id: string) => {
    if (!editingPaletteName.trim()) return;
    
    const updated = palettes.map(p =>
      p.id === id ? { ...p, name: editingPaletteName.trim() } : p
    );
    setPalettes(updated);
    savePalettes(updated);
    setEditingPaletteId(null);
    setEditingPaletteName('');
  };
  
  // Add color to palette
  const handleAddColorToPalette = (paletteId: string, color: string) => {
    const updated = palettes.map(p =>
      p.id === paletteId && !p.colors.includes(color)
        ? { ...p, colors: [...p.colors, color] }
        : p
    );
    setPalettes(updated);
    savePalettes(updated);
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
          className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-200"
          style={{ 
            bottom: '80px',
            left: '20px',
            right: '20px',
            width: 'auto',
            maxWidth: '320px',
            maxHeight: 'calc(100vh - 100px)',
            marginLeft: 'auto',
            top: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Fixed Header with Close button */}
          <div className="flex justify-between items-center p-4 pb-3 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Color Picker</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 overscroll-contain">
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

            {/* Saturation/Brightness Gradient - Reduced height */}
            <div
              ref={gradientRef}
              className="relative w-full h-32 rounded-lg cursor-crosshair overflow-hidden shadow-inner"
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

            {/* Hue Slider - Reduced height */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Hue</label>
              <div
                ref={hueRef}
                className="relative w-full h-6 rounded-lg cursor-pointer overflow-hidden shadow-inner"
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

            {/* RGB Inputs - More compact */}
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
            
            {/* Recent Colors */}
            {recentColors.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Recent Colors</label>
                <div className="flex flex-wrap gap-2">
                  {recentColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => applyColor(color)}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:scale-110 transition-all shadow-sm cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Saved Palettes */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700">Saved Palettes</label>
                <button
                  onClick={() => setShowNewPalette(!showNewPalette)}
                  className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  + New
                </button>
              </div>
              
              {/* New Palette Form */}
              {showNewPalette && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    placeholder="Palette name..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePalette();
                      if (e.key === 'Escape') {
                        setShowNewPalette(false);
                        setNewPaletteName('');
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleCreatePalette}
                      disabled={!newPaletteName.trim()}
                      className="flex-1 text-xs px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewPalette(false);
                        setNewPaletteName('');
                      }}
                      className="flex-1 text-xs px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Palette List */}
              <div className="space-y-2">
                {palettes.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">No palettes yet</p>
                ) : (
                  palettes.map((palette) => (
                    <div key={palette.id} className="p-2 bg-gray-50 rounded-lg">
                      {editingPaletteId === palette.id ? (
                        <div className="mb-2">
                          <input
                            type="text"
                            value={editingPaletteName}
                            onChange={(e) => setEditingPaletteName(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenamePalette(palette.id);
                              if (e.key === 'Escape') {
                                setEditingPaletteId(null);
                                setEditingPaletteName('');
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRenamePalette(palette.id)}
                              className="flex-1 text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingPaletteId(null);
                                setEditingPaletteName('');
                              }}
                              className="flex-1 text-xs px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 truncate flex-1">{palette.name}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingPaletteId(palette.id);
                                setEditingPaletteName(palette.name);
                              }}
                              className="text-xs px-2 py-0.5 hover:bg-gray-200 rounded transition-colors"
                              title="Rename"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleAddColorToPalette(palette.id, value)}
                              className="text-xs px-2 py-0.5 hover:bg-gray-200 rounded transition-colors"
                              title="Add current color"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleDeletePalette(palette.id)}
                              className="text-xs px-2 py-0.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                              title="Delete palette"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {palette.colors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => applyColor(color)}
                            className="w-6 h-6 rounded border border-gray-300 hover:border-blue-500 hover:scale-110 transition-all cursor-pointer"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
