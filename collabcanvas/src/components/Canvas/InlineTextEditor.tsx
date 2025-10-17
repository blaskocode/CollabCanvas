import React, { useState, useEffect, useRef } from 'react';
import type { Shape } from '../../utils/types';

interface InlineTextEditorProps {
  shape: Shape;
  stageScale: number;
  stageX: number;
  stageY: number;
  onSave: (updates: { 
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: string;
    textAlign?: 'left' | 'center' | 'right';
    textColor?: string;
  }) => void;
  onUpdate: (updates: { 
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: string;
    textAlign?: 'left' | 'center' | 'right';
    textColor?: string;
  }) => void;
  onCancel: () => void;
}

/**
 * InlineTextEditor Component
 * Displays an absolutely positioned text input for editing shape text with rich formatting
 * Triggered by double-clicking shapes
 * 
 * @param props - InlineTextEditor properties
 */
const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  shape,
  stageScale,
  stageX,
  stageY,
  onSave,
  onUpdate,
  onCancel,
}) => {
  const [text, setText] = useState(shape.text || '');
  const [fontSize, setFontSize] = useState(shape.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(shape.fontFamily || 'Arial');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(shape.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(shape.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState(shape.textDecoration || '');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(shape.textAlign || 'center');
  const [textColor, setTextColor] = useState(shape.textColor || '#000000');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  // Calculate position on screen
  const screenX = shape.x * stageScale + stageX;
  const screenY = shape.y * stageScale + stageY;
  const screenWidth = shape.width * stageScale;
  const screenHeight = shape.height * stageScale;
  
  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  // Handle save
  const handleSave = () => {
    onSave({
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      textColor,
    });
  };
  
  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without shift saves (shift+enter for new line)
      e.preventDefault();
      handleSave();
    }
    
    // Stop propagation to prevent canvas shortcuts
    e.stopPropagation();
  };
  
  // Handle blur (clicking outside) - but not if clicking toolbar
  const handleBlur = (e: React.FocusEvent) => {
    // Don't save if clicking on toolbar
    if (toolbarRef.current && toolbarRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    handleSave();
  };
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle font family change - update without closing editor
  const handleFontFamilyChange = (newFontFamily: string) => {
    setFontFamily(newFontFamily);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily: newFontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      textColor,
    });
  };

  // Handle font size change - update without closing editor
  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(newFontSize);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize: newFontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      textColor,
    });
  };

  // Handle text align change - update without closing editor
  const handleTextAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    setTextAlign(newAlign);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign: newAlign,
      textColor,
    });
  };

  // Handle text color change - update without closing editor
  const handleTextColorChange = (newColor: string) => {
    setTextColor(newColor);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      textColor: newColor,
    });
  };

  // Toggle bold - update without closing editor
  const toggleBold = () => {
    const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
    setFontWeight(newWeight);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily,
      fontWeight: newWeight,
      fontStyle,
      textDecoration,
      textAlign,
      textColor,
    });
  };
  
  // Toggle italic - update without closing editor
  const toggleItalic = () => {
    const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
    setFontStyle(newStyle);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle: newStyle,
      textDecoration,
      textAlign,
      textColor,
    });
  };
  
  // Toggle underline - update without closing editor
  const toggleUnderline = () => {
    let newDecoration: string;
    if (textDecoration.includes('underline')) {
      newDecoration = textDecoration.replace('underline', '').trim();
    } else {
      newDecoration = (textDecoration + ' underline').trim();
    }
    setTextDecoration(newDecoration);
    // Update shape but keep editor open
    onUpdate({
      text,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration: newDecoration,
      textAlign,
      textColor,
    });
  };
  
  // Toolbar height
  const toolbarHeight = 56;
  
  return (
    <>
      {/* Formatting Toolbar */}
      <div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          left: `${screenX}px`,
          top: `${screenY - toolbarHeight - 10}px`,
          minWidth: `${Math.max(screenWidth, 600)}px`,
          backgroundColor: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          padding: '10px 12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          zIndex: 1001,
          pointerEvents: 'all',
          flexWrap: 'nowrap',
        }}
        onMouseDown={(e) => {
          // Allow select dropdowns, options, and inputs to work, but prevent blur for buttons
          const target = e.target as HTMLElement;
          const allowedTags = ['SELECT', 'OPTION', 'INPUT'];
          if (!allowedTags.includes(target.tagName)) {
            e.preventDefault();
          }
        }}
      >
        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => handleFontFamilyChange(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            minWidth: '140px',
          }}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
        </select>
        
        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            backgroundColor: '#ffffff',
            minWidth: '70px',
          }}
        >
          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72].map(size => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        
        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        
        {/* Bold */}
        <button
          onClick={toggleBold}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: fontWeight === 'bold' ? '#3b82f6' : '#ffffff',
            color: fontWeight === 'bold' ? '#ffffff' : '#374151',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '36px',
            transition: 'all 0.2s',
          }}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        
        {/* Italic */}
        <button
          onClick={toggleItalic}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: fontStyle === 'italic' ? '#3b82f6' : '#ffffff',
            color: fontStyle === 'italic' ? '#ffffff' : '#374151',
            fontStyle: 'italic',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '36px',
            transition: 'all 0.2s',
          }}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        
        {/* Underline */}
        <button
          onClick={toggleUnderline}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: textDecoration.includes('underline') ? '#3b82f6' : '#ffffff',
            color: textDecoration.includes('underline') ? '#ffffff' : '#374151',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
            minWidth: '36px',
            transition: 'all 0.2s',
          }}
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        
        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        
        {/* Align Left */}
        <button
          onClick={() => handleTextAlignChange('left')}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: textAlign === 'left' ? '#3b82f6' : '#ffffff',
            color: textAlign === 'left' ? '#ffffff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            minWidth: '36px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Align Left"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="0" y="2" width="12" height="2" />
            <rect x="0" y="6" width="16" height="2" />
            <rect x="0" y="10" width="10" height="2" />
          </svg>
        </button>
        
        {/* Align Center */}
        <button
          onClick={() => handleTextAlignChange('center')}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: textAlign === 'center' ? '#3b82f6' : '#ffffff',
            color: textAlign === 'center' ? '#ffffff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            minWidth: '36px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Align Center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="2" width="12" height="2" />
            <rect x="0" y="6" width="16" height="2" />
            <rect x="3" y="10" width="10" height="2" />
          </svg>
        </button>
        
        {/* Align Right */}
        <button
          onClick={() => handleTextAlignChange('right')}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: textAlign === 'right' ? '#3b82f6' : '#ffffff',
            color: textAlign === 'right' ? '#ffffff' : '#374151',
            cursor: 'pointer',
            fontSize: '12px',
            minWidth: '36px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Align Right"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="2" width="12" height="2" />
            <rect x="0" y="6" width="16" height="2" />
            <rect x="6" y="10" width="10" height="2" />
          </svg>
        </button>
        
        {/* Divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db' }} />
        
        {/* Text Color */}
        <input
          type="color"
          value={textColor}
          onChange={(e) => handleTextColorChange(e.target.value)}
          style={{
            width: '40px',
            height: '32px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Text Color"
        />
      </div>
      
      {/* Text Input */}
      <div
        style={{
          position: 'absolute',
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${screenWidth}px`,
          height: `${screenHeight}px`,
          pointerEvents: 'all',
          zIndex: 1000,
        }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          style={{
            width: '100%',
            height: '100%',
            padding: '12px',
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            textDecoration: textDecoration,
            textAlign: textAlign,
            color: textColor,
            border: '3px solid #3b82f6',
            borderRadius: '8px',
            outline: 'none',
            resize: 'none',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            overflow: 'auto',
            boxSizing: 'border-box',
            lineHeight: '1.5',
          }}
          placeholder="Enter text..."
        />
      </div>
    </>
  );
};

export default InlineTextEditor;

