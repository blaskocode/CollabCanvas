import React, { useState, useEffect, useRef } from 'react';
import type { Shape } from '../../utils/types';

interface InlineTextEditorProps {
  shape: Shape;
  stageScale: number;
  stageX: number;
  stageY: number;
  onSave: (text: string) => void;
  onCancel: () => void;
}

/**
 * InlineTextEditor Component
 * Displays an absolutely positioned text input for editing shape text
 * Triggered by double-clicking workflow shapes
 * 
 * @param props - InlineTextEditor properties
 */
const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  shape,
  stageScale,
  stageX,
  stageY,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(shape.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without shift saves (shift+enter for new line)
      e.preventDefault();
      onSave(text);
    }
    
    // Stop propagation to prevent canvas shortcuts
    e.stopPropagation();
  };
  
  // Handle blur (clicking outside)
  const handleBlur = () => {
    onSave(text);
  };
  
  // Handle change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Calculate font size based on shape size
  const fontSize = Math.max(12, Math.min(24, screenHeight / 4));
  
  return (
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
          padding: '10px',
          fontSize: `${fontSize}px`,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          verticalAlign: 'middle',
          border: '2px solid #2563eb',
          borderRadius: '4px',
          outline: 'none',
          resize: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
        placeholder="Enter text..."
      />
    </div>
  );
};

export default InlineTextEditor;

