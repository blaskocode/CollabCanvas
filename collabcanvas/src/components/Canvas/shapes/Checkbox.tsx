import React from 'react';
import { Rect, Line, Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface CheckboxProps {
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
 * Checkbox Form Element Component
 * Visual mockup of a checkbox with label for wireframing
 */
const Checkbox: React.FC<CheckboxProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill: _fill,
  stroke,
  strokeWidth = 2,
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

  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;
  let finalStroke = stroke || '#6b7280';
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb';
    finalStrokeWidth = 2;
  }
  if (isLockedByOtherUser) {
    finalStroke = '#ef4444';
    finalStrokeWidth = 3;
  }

  const boxSize = 20;
  const checked = formOptions?.checked || false;
  const label = formOptions?.label || 'Checkbox option';

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
      {/* Checkbox box */}
      <Rect
        x={0}
        y={0}
        width={boxSize}
        height={boxSize}
        fill={checked ? '#3b82f6' : '#ffffff'}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        cornerRadius={3}
        opacity={opacity / 100}
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {/* Checkmark if checked */}
      {checked && (
        <Line
          points={[
            boxSize * 0.25, boxSize * 0.5,
            boxSize * 0.45, boxSize * 0.7,
            boxSize * 0.75, boxSize * 0.3
          ]}
          stroke="#ffffff"
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
      
      {/* Label */}
      <KonvaText
        x={boxSize + 10}
        y={(boxSize - 14) / 2}
        text={label}
        fontSize={14}
        fontFamily="Arial"
        fill="#374151"
        listening={false}
      />
    </Group>
  );
};

export default React.memo(Checkbox);

