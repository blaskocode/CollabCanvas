import React from 'react';
import { Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface CircleProps {
  id: string;
  x: number;
  y: number;
  radius: number;
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
  onSelect: (e?: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
}

/**
 * Circle Component
 * Renders a circle shape with selection, dragging, and lock states
 * 
 * @param props - Circle properties
 */
const Circle: React.FC<CircleProps> = ({
  id,
  x,
  y,
  radius,
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
}) => {
  const shapeRef = React.useRef<Konva.Circle>(null);

  /**
   * Handle shape click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent stage click
    onSelect(e);
  };

  /**
   * Handle shape tap (mobile) to select
   */
  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true; // Prevent stage click
    onSelect(e);
  };

  /**
   * Handle drag start to notify parent
   */
  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (onDragStart) {
      onDragStart();
    }
  };

  /**
   * Handle drag end to update position
   * Enforces canvas boundaries
   */
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Constrain to canvas boundaries (accounting for radius)
    const constrainedX = Math.max(radius, Math.min(newX, CANVAS_WIDTH - radius));
    const constrainedY = Math.max(radius, Math.min(newY, CANVAS_HEIGHT - radius));

    // Update position if constrained
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

    // Constrain to canvas boundaries (accounting for radius)
    const constrainedX = Math.max(radius, Math.min(newX, CANVAS_WIDTH - radius));
    const constrainedY = Math.max(radius, Math.min(newY, CANVAS_HEIGHT - radius));

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
    <KonvaCircle
      ref={shapeRef}
      id={id}
      x={x}
      y={y}
      radius={radius}
      fill={fill}
      stroke={finalStroke}
      strokeWidth={finalStrokeWidth}
      opacity={opacity / 100} // Convert 0-100 to 0-1
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={!isLockedByOtherUser}
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
export default React.memo(Circle);

