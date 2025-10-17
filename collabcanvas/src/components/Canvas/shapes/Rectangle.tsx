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
  onSelect: (e?: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
  onRef?: (node: Konva.Rect | null) => void;
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
  onDragMove,
  onDragEnd,
  onContextMenu,
  onRef,
}) => {
  const shapeRef = React.useRef<Konva.Rect>(null);
  
  // Call onRef callback when ref changes
  React.useEffect(() => {
    if (onRef) {
      onRef(shapeRef.current);
    }
  }, [onRef]);

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
   * Handle context menu (right-click)
   */
  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.cancelBubble = true; // Prevent stage context menu
    if (onContextMenu) {
      onContextMenu(e);
    }
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
   * Constrain drag bounds during dragging and notify parent for multi-select/group drag
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
    
    // Notify parent for multi-select/group drag
    if (onDragMove) {
      onDragMove(constrainedX, constrainedY);
    }
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
      onContextMenu={handleContextMenu}
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

