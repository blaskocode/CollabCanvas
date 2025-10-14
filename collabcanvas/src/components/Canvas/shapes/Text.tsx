import React, { useRef } from 'react';
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
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTextChange?: (text: string) => void;
}

/**
 * Text Component
 * Renders a text shape with selection and dragging
 * Note: Text editing will be enhanced in a future update
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
  isSelected,
  isLocked,
  lockedBy,
  currentUserId,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const textRef = useRef<Konva.Text>(null);

  /**
   * Handle shape click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
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
  let finalStroke = stroke || 'transparent';
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb'; // Blue for selected
    finalStrokeWidth = 1;
  }

  if (isLockedByOtherUser) {
    finalStroke = '#ef4444'; // Red for locked by another user
    finalStrokeWidth = 2;
  }

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
      draggable={!isLockedByOtherUser}
      onClick={handleClick}
      onTap={handleClick}
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

export default Text;

