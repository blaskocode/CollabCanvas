import React from 'react';
import { Rect, Circle, Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface ToggleProps {
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
  formOptions?: {
    label?: string;
    checked?: boolean;
  };
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
 * Toggle Switch Form Element Component
 * Visual mockup of a toggle switch with label for wireframing
 */
const Toggle: React.FC<ToggleProps> = ({
  id,
  x,
  y,
  width: _width,
  height: _height,
  fill: _fill,
  stroke,
  strokeWidth = 0,
  opacity = 100,
  rotation = 0,
  scaleX = 1,
  scaleY = 1,
  formOptions,
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
  
  React.useEffect(() => {
    if (onRef) {
      onRef(groupRef.current);
    }
  }, [onRef]);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(e);
  };

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


  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.cancelBubble = true;
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (onDragStart) {
      onDragStart();
    }
  };

  // Use fixed toggle dimensions
  const TOGGLE_WIDTH = 48;
  const TOGGLE_HEIGHT = 24;

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - TOGGLE_WIDTH));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - TOGGLE_HEIGHT));
    if (newX !== constrainedX || newY !== constrainedY) {
      node.position({ x: constrainedX, y: constrainedY });
    }
    onDragEnd(constrainedX, constrainedY);
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - TOGGLE_WIDTH));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - TOGGLE_HEIGHT));
    node.position({ x: constrainedX, y: constrainedY });
    if (onDragMove) {
      onDragMove(constrainedX, constrainedY);
    }
  };

  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;
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

  const checked = formOptions?.checked || false;
  const label = formOptions?.label;
  const toggleBgColor = checked ? '#3b82f6' : '#d1d5db';

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
      {/* Toggle track (rounded rectangle) - this is the main shape */}
      <Rect
        width={TOGGLE_WIDTH}
        height={TOGGLE_HEIGHT}
        fill={toggleBgColor}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        opacity={opacity / 100}
        cornerRadius={TOGGLE_HEIGHT / 2}
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {/* Toggle knob */}
      <Circle
        x={checked ? TOGGLE_WIDTH - TOGGLE_HEIGHT / 2 - 2 : TOGGLE_HEIGHT / 2 + 2}
        y={TOGGLE_HEIGHT / 2}
        radius={TOGGLE_HEIGHT / 2 - 3}
        fill="#ffffff"
        shadowColor="#00000033"
        shadowBlur={4}
        shadowOpacity={1}
        listening={false}
      />
      
      {/* Label if provided */}
      {label && (
        <KonvaText
          x={TOGGLE_WIDTH + 10}
          y={(TOGGLE_HEIGHT - 14) / 2}
          text={label}
          fontSize={14}
          fontFamily="Arial"
          fill="#374151"
          listening={false}
        />
      )}
    </Group>
  );
};

export default React.memo(Toggle);

