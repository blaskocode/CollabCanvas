import React from 'react';
import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface RectangleProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
}

/**
 * Rectangle Component
 * Renders a rectangle shape with selection, dragging, and lock states
 * 
 * @param props - Rectangle properties
 */
const Rectangle: React.FC<RectangleProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 0,
  opacity = 100,
  cornerRadius = 0,
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
}) => {
  const shapeRef = React.useRef<Konva.Rect>(null);

  /**
   * Handle shape click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent stage click
    onSelect();
  };

  /**
   * Handle shape tap (mobile) to select
   */
  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true; // Prevent stage click
    onSelect();
  };

  /**
   * Handle drag start to notify parent
   * Prevents event from bubbling to stage
   */
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent stage from receiving drag event
    if (onDragStart) {
      onDragStart();
    }
  };

  /**
   * Handle drag end to update position
   * Enforces canvas boundaries and prevents event bubbling
   */
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent stage from receiving drag event
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    // Update position if constrained
    if (newX !== constrainedX || newY !== constrainedY) {
      node.position({ x: constrainedX, y: constrainedY });
    }

    onDragEnd(constrainedX, constrainedY);
  };

  /**
   * Constrain drag bounds during dragging
   * Prevents event bubbling to stage
   */
  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Prevent stage from receiving drag event
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    node.position({ x: constrainedX, y: constrainedY });
  };

  // Check if shape is locked by another user
  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;

  // Determine stroke color and style based on selection and lock state
  let finalStroke = stroke || 'transparent';
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb'; // Blue for selected
    finalStrokeWidth = 2;
  }

  if (isLockedByOtherUser) {
    finalStroke = '#ef4444'; // Red for locked by another user
    finalStrokeWidth = 3;
  }

  return (
    <Rect
      ref={shapeRef}
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={finalStroke}
      strokeWidth={finalStrokeWidth}
      opacity={opacity / 100} // Convert 0-100 to 0-1
      cornerRadius={cornerRadius}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={!isLockedByOtherUser} // Only draggable if not locked by another user
      onClick={handleClick}
      onTap={handleTap}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      shadowColor={isSelected ? '#2563eb' : 'transparent'}
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.3 : 0}
    />
  );
};

// Memoize component to prevent re-renders when props haven't changed
export default React.memo(Rectangle);

