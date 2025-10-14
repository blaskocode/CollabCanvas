import React from 'react';
import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';

interface ShapeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  onSelect: () => void;
  onDragStart?: () => void;
  onDragEnd: (x: number, y: number) => void;
}

/**
 * Shape Component
 * Renders a rectangle shape with selection, dragging, and lock states
 * 
 * @param props - Shape properties
 */
const Shape: React.FC<ShapeProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill,
  isSelected,
  isLocked,
  lockedBy,
  currentUserId,
  onSelect,
  onDragStart,
  onDragEnd,
}) => {
  const shapeRef = React.useRef<Konva.Rect>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  // Attach transformer when selected
  React.useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
  let stroke = 'transparent';
  let strokeWidth = 0;

  if (isSelected) {
    stroke = '#2563eb'; // Blue for selected
    strokeWidth = 2;
  }

  if (isLockedByOtherUser) {
    stroke = '#ef4444'; // Red for locked by another user
    strokeWidth = 3;
  }

  return (
    <>
      <Rect
        ref={shapeRef}
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
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
      {/* Transformer for resize/rotate (disabled for MVP, will be added in Phase 2) */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={[]} // Disable resize anchors for MVP
          rotateEnabled={false} // Disable rotation for MVP
          borderEnabled={false} // Hide border since we use stroke
        />
      )}
    </>
  );
};

export default Shape;

