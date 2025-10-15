import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface TextProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  onSelect: (e?: any) => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTextChange?: (text: string) => void;
}

/**
 * Text Component
 * Renders a text shape with selection, dragging, and editing
 * 
 * @param props - Text properties
 */
const Text: React.FC<TextProps> = ({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize = 16,
  fontFamily = 'Arial',
  textAlign = 'left',
  fill,
  stroke,
  strokeWidth = 0,
  opacity = 100,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  isSelected,
  isLocked,
  lockedBy,
  currentUserId,
  onSelect,
  onDragStart,
  onDragEnd,
  onTextChange,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  
  // Store callback in ref to avoid recreating textarea on every render
  const onTextChangeRef = useRef(onTextChange);
  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  // Update edit value when text prop changes
  useEffect(() => {
    setEditValue(text);
  }, [text]);

  /**
   * Handle shape click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(e);
  };

  /**
   * Handle double-click to enter edit mode
   */
  const handleDoubleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    // Don't allow editing if locked by another user
    if (isLockedByOtherUser) {
      return;
    }
    
    setIsEditing(true);
    setEditValue(text);
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (onDragStart) {
      onDragStart();
    }
  };

  /**
   * Handle drag end with boundary constraints
   */
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    if (newX !== constrainedX || newY !== constrainedY) {
      node.position({ x: constrainedX, y: constrainedY });
    }

    onDragEnd(constrainedX, constrainedY);
  };

  /**
   * Constrain drag bounds during dragging
   */
  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    node.position({ x: constrainedX, y: constrainedY });
  };

  // Check if shape is locked by another user
  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;

  // Determine stroke based on selection and lock state
  let finalStroke = 'transparent';
  let finalStrokeWidth = 0;

  if (isSelected) {
    finalStroke = '#2563eb'; // Blue for selected
    finalStrokeWidth = 1;
  }

  if (isLockedByOtherUser) {
    finalStroke = '#ef4444'; // Red for locked by another user
    finalStrokeWidth = 2;
  }

  // Render textarea portal outside Konva tree using useEffect
  // Only depends on isEditing to avoid recreating on every pan/zoom
  useEffect(() => {
    if (!isEditing) return;

    // Get screen position from Konva node directly (accounts for stage transformation)
    const node = textRef.current;
    if (!node) return;

    const stage = node.getStage();
    if (!stage) return;

    const absolutePosition = node.getAbsolutePosition();
    const stageScale = stage.scaleX(); // Assume uniform scale
    
    // Calculate screen coordinates
    const screenX = absolutePosition.x;
    const screenY = absolutePosition.y;
    const screenWidth = width * stageScale;
    const screenHeight = height * stageScale;
    const screenFontSize = fontSize * stageScale;

    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text; // Start with the current text
    textarea.style.cssText = `
      position: absolute;
      top: ${screenY}px;
      left: ${screenX}px;
      width: ${screenWidth}px;
      height: ${screenHeight}px;
      font-size: ${screenFontSize}px;
      font-family: ${fontFamily};
      text-align: ${textAlign};
      color: ${fill};
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #2563eb;
      border-radius: 4px;
      padding: 5px;
      resize: none;
      outline: none;
      z-index: 1000;
    `;

    // Track if we should save on blur
    let shouldSave = true;

    // Event handlers - inline to avoid dependency issues
    const handleChange = (e: Event) => {
      // Update is handled by textarea itself, no need to sync to React state during editing
    };

    const handleBlur = () => {
      if (shouldSave) {
        const finalValue = textarea.value.trim();
        setIsEditing(false);
        // Only save if the value actually changed and is not empty
        if (finalValue && finalValue !== text && onTextChangeRef.current) {
          onTextChangeRef.current(finalValue);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        shouldSave = false;
        setIsEditing(false);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const finalValue = textarea.value.trim();
        shouldSave = false; // Prevent blur from also saving
        setIsEditing(false);
        // Only save if the value actually changed and is not empty
        if (finalValue && finalValue !== text && onTextChangeRef.current) {
          onTextChangeRef.current(finalValue);
        }
      }
    };

    textarea.addEventListener('input', handleChange);
    textarea.addEventListener('blur', handleBlur);
    textarea.addEventListener('keydown', handleKeyDown);

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    // Cleanup
    return () => {
      textarea.removeEventListener('input', handleChange);
      textarea.removeEventListener('blur', handleBlur);
      textarea.removeEventListener('keydown', handleKeyDown);
      if (textarea.parentNode) {
        document.body.removeChild(textarea);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  return (
    <KonvaText
      ref={textRef}
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      text={text}
      fontSize={fontSize}
      fontFamily={fontFamily}
      align={textAlign}
      fill={fill}
      stroke={finalStroke}
      strokeWidth={finalStrokeWidth}
      opacity={opacity / 100} // Convert 0-100 to 0-1
      rotation={rotation}
      scaleX={1}
      scaleY={1}
      draggable={!isLockedByOtherUser && !isEditing}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      shadowColor={isSelected ? '#2563eb' : 'transparent'}
      shadowBlur={isSelected ? 5 : 0}
      shadowOpacity={isSelected ? 0.3 : 0}
      padding={5}
    />
  );
};

// Memoize component to prevent re-renders when props haven't changed
export default React.memo(Text);
