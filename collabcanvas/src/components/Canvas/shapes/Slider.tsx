import React from 'react';
import { Rect, Circle, Text as KonvaText, Group } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface SliderProps {
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
    value?: number;
    min?: number;
    max?: number;
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
 * Slider Form Element Component
 * Visual mockup of a range slider with label for wireframing
 */
const Slider: React.FC<SliderProps> = ({
  id,
  x,
  y,
  width: _width,
  height: _height,
  fill,
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

  // Fixed dimensions for boundary calculations
  const SLIDER_WIDTH = 200;
  const SLIDER_HEIGHT = 24;

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - SLIDER_WIDTH));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - SLIDER_HEIGHT));
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
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - SLIDER_WIDTH));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - SLIDER_HEIGHT));
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

  const label = formOptions?.label;
  const value = formOptions?.value ?? 50;
  const min = formOptions?.min ?? 0;
  const max = formOptions?.max ?? 100;
  
  // Fixed dimensions for the slider
  const sliderWidth = 200;
  const sliderHeight = 24;
  const trackHeight = 6;
  const thumbSize = 20;
  
  // Calculate positions relative to group origin
  const trackY = (sliderHeight - trackHeight) / 2;
  
  // Calculate thumb position based on value
  const percentage = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const thumbX = sliderWidth * percentage;

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
      {/* Label if provided */}
      {label && (
        <KonvaText
          x={0}
          y={-18}
          text={label}
          fontSize={12}
          fontFamily="Arial"
          fill="#374151"
          listening={false}
        />
      )}
      
      {/* Slider track (background) */}
      <Rect
        x={0}
        y={trackY}
        width={sliderWidth}
        height={trackHeight}
        fill="#e5e7eb"
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        cornerRadius={trackHeight / 2}
        opacity={opacity / 100}
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {/* Filled track (progress) */}
      <Rect
        x={0}
        y={trackY}
        width={sliderWidth * percentage}
        height={trackHeight}
        fill={fill}
        cornerRadius={trackHeight / 2}
        listening={false}
      />
      
      {/* Slider thumb */}
      <Circle
        x={thumbX}
        y={trackY + trackHeight / 2}
        radius={thumbSize / 2}
        fill="#ffffff"
        stroke={fill}
        strokeWidth={2}
        shadowColor="#00000033"
        shadowBlur={4}
        shadowOpacity={1}
        listening={false}
      />
      
      {/* Value label */}
      <KonvaText
        x={sliderWidth + 10}
        y={(sliderHeight - 14) / 2}
        text={value.toString()}
        fontSize={14}
        fontFamily="Arial"
        fill="#374151"
        listening={false}
      />
    </Group>
  );
};

export default React.memo(Slider);

