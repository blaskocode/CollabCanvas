import React from 'react';
import { Rect, Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface ProcessBoxProps {
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
  text?: string;
  fontSize?: number;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  isDraggingDisabled?: boolean;
  onSelect: (e?: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => void;
  onDblClick?: (e?: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
  onRef?: (node: Konva.Group | null) => void;
}

/**
 * ProcessBox Component
 * Renders a rounded rectangle for workflow process steps
 * Default flowchart shape for actions and processes
 * 
 * @param props - ProcessBox properties
 */
const ProcessBox: React.FC<ProcessBoxProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 0,
  opacity = 100,
  cornerRadius = 8,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  text = '',
  fontSize = 16,
  isSelected,
  isLocked,
  lockedBy,
  currentUserId,
  isDraggingDisabled = false,
  onSelect,
  onDblClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onContextMenu,
  onRef,
}) => {
  const groupRef = React.useRef<Konva.Group>(null);
  
  // Call onRef callback when ref changes
  React.useEffect(() => {
    if (onRef) {
      onRef(groupRef.current);
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
   * Handle double-click to edit text
   */
  const handleDblClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Prevent stage from receiving event
    if (onDblClick) {
      onDblClick(e);
    }
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
    <Group
      ref={groupRef}
      id={id}
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={!isLockedByOtherUser && !isDraggingDisabled}
      onClick={handleClick}
      onDblClick={handleDblClick}
      onTap={handleTap}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
    >
      {/* Process box rectangle */}
      <Rect
        width={width}
        height={height}
        fill={fill}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        opacity={opacity / 100}
        cornerRadius={cornerRadius}
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {/* Text label */}
      {text && (
        <KonvaText
          text={text}
          width={width}
          height={height}
          fontSize={fontSize}
          fontFamily="Arial, sans-serif"
          fill="#000000"
          align="center"
          verticalAlign="middle"
          padding={10}
          wrap="word"
          ellipsis={true}
          listening={false} // Text doesn't handle events
        />
      )}
    </Group>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export default React.memo(ProcessBox);

