import React from 'react';
import { Shape as KonvaShape, Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface DatabaseShapeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
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
  listening?: boolean;
  onSelect: (e?: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => void;
  onDblClick?: (e?: KonvaEventObject<MouseEvent>) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
  onRef?: (node: Konva.Group | null) => void;
}

/**
 * DatabaseShape Component
 * Renders a cylinder shape for database representations
 * Used for data storage, database operations, etc.
 * 
 * @param props - DatabaseShape properties
 */
const DatabaseShape: React.FC<DatabaseShapeProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 0,
  opacity = 100,
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
  listening = true,
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
    e.cancelBubble = true;
    onSelect(e);
  };

  /**
   * Handle shape tap (mobile) to select
   */
  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
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
    e.cancelBubble = true;
    if (onContextMenu) {
      onContextMenu(e);
    }
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

    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    if (newX !== constrainedX || newY !== constrainedY) {
      node.position({ x: constrainedX, y: constrainedY });
    }

    onDragEnd(constrainedX, constrainedY);
  };

  /**
   * Handle drag move
   */
  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - width));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - height));

    node.position({ x: constrainedX, y: constrainedY });
    
    if (onDragMove) {
      onDragMove(constrainedX, constrainedY);
    }
  };

  // Check if shape is locked by another user
  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;

  // Determine stroke color and style
  let finalStroke = stroke || 'transparent';
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb';
    finalStrokeWidth = 2;
  }

  if (isLockedByOtherUser) {
    finalStroke = '#ef4444';
    finalStrokeWidth = 3;
  }

  /**
   * Scene function to draw cylinder (database) shape
   */
  const sceneFunc = (context: any, shape: any) => {
    const ellipseHeight = height * 0.15; // Height of top/bottom ellipse
    const radiusX = width / 2;
    const radiusY = ellipseHeight / 2;
    const centerX = width / 2;
    
    context.beginPath();
    
    // Top ellipse (full)
    context.ellipse(centerX, radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    // Left side line
    context.moveTo(0, radiusY);
    context.lineTo(0, height - radiusY);
    
    // Bottom ellipse (only bottom half visible)
    context.ellipse(centerX, height - radiusY, radiusX, radiusY, 0, 0, Math.PI);
    
    // Right side line
    context.lineTo(width, radiusY);
    
    context.closePath();
    
    // Fill and stroke
    context.fillStrokeShape(shape);
    
    // Draw top ellipse outline again to show the 3D effect
    context.beginPath();
    context.ellipse(centerX, radiusY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    context.strokeShape(shape);
    
    // Add faint line on right side for depth
    context.beginPath();
    context.moveTo(width, radiusY);
    context.lineTo(width, height - radiusY);
    context.strokeStyle = 'rgba(0, 0, 0, 0.15)'; // Faint black line
    context.lineWidth = 1;
    context.stroke();
  };

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
      listening={listening}
      onClick={handleClick}
      onDblClick={handleDblClick}
      onTap={handleTap}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
    >
      {/* Cylinder/database shape */}
      <KonvaShape
        sceneFunc={sceneFunc}
        fill={fill}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        opacity={opacity / 100}
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
          listening={false}
        />
      )}
    </Group>
  );
};

// Memoize component
export default React.memo(DatabaseShape);

