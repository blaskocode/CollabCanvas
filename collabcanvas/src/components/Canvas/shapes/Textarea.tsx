import React from 'react';
import { Rect, Text as KonvaText, Line } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface TextareaProps {
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
    placeholder?: string;
    label?: string;
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
  onRef?: (node: Konva.Rect | null) => void;
}

/**
 * Textarea Form Element Component
 * Visual mockup of a multi-line text area for wireframing
 */
const Textarea: React.FC<TextareaProps> = ({
  id,
  x,
  y,
  width,
  height,
  fill,
  stroke,
  strokeWidth = 1,
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
  const shapeRef = React.useRef<Konva.Rect>(null);
  
  React.useEffect(() => {
    if (onRef) {
      onRef(shapeRef.current);
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
  let finalStroke = stroke || '#d1d5db';
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb';
    finalStrokeWidth = 2;
  }
  if (isLockedByOtherUser) {
    finalStroke = '#ef4444';
    finalStrokeWidth = 3;
  }

  const placeholder = formOptions?.placeholder || 'Enter text...';
  const label = formOptions?.label;

  return (
    <>
      {/* Label above textarea if provided */}
      {label && (
        <KonvaText
          x={x}
          y={y - 18}
          text={label}
          fontSize={12}
          fontFamily="Arial"
          fill="#374151"
          listening={false}
        />
      )}
      
      {/* Textarea background */}
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
        opacity={opacity / 100}
        cornerRadius={4}
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
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {/* Placeholder text */}
      <KonvaText
        x={x + 10}
        y={y + 10}
        text={placeholder}
        fontSize={14}
        fontFamily="Arial"
        fill="#9ca3af"
        width={width - 20}
        listening={false}
      />
      
      {/* Resize indicator in bottom-right corner */}
      <Line
        points={[
          x + width - 12, y + height - 4,
          x + width - 4, y + height - 4,
          x + width - 4, y + height - 12
        ]}
        stroke="#d1d5db"
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      <Line
        points={[
          x + width - 8, y + height - 4,
          x + width - 4, y + height - 4,
          x + width - 4, y + height - 8
        ]}
        stroke="#d1d5db"
        strokeWidth={1}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    </>
  );
};

export default React.memo(Textarea);

