import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

/**
 * ColorPicker Component
 * HTML5 color picker with swatch and hex value display
 * 
 * @param props - ColorPicker properties
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-700 block">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        {/* Color swatch preview */}
        <div
          className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: value }}
          title={value}
        />
        
        {/* HTML5 color input */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-16 h-10 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
        
        {/* Hex value display and input */}
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const hex = e.target.value;
            // Validate hex color format
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
              onChange(hex);
            }
          }}
          placeholder="#000000"
          maxLength={7}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
        />
      </div>
    </div>
  );
};

export default ColorPicker;

