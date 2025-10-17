import React from 'react';
import { Line, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';
import { getContrastTextColor } from '../../../utils/colorUtils';

interface OctagonProps {
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
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: string;
  textColor?: string;
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
  onRef?: (node: Konva.Line | null) => void;
}

/**
 * Octagon Component
 * Renders a regular octagon
 */
const Octagon: React.FC<OctagonProps> = ({
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
  text,
  fontSize = 16,
  fontFamily = 'Arial',
  textAlign = 'center',
  verticalAlign = 'middle',
  fontWeight = 'normal',
  fontStyle = 'normal',
  textDecoration = '',
  textColor,
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
  const shapeRef = React.useRef<Konva.Line>(null);
  
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

  // Regular octagon points (equal sides, flat top)
  const offset = Math.min(width, height) * 0.293; // Approx (1 - 1/sqrt(2))/2
  const points = [
    offset, 0,                    // Top-left start
    width - offset, 0,            // Top-right start
    width, offset,                // Top-right corner
    width, height - offset,       // Bottom-right corner
    width - offset, height,       // Bottom-right start
    offset, height,               // Bottom-left start
    0, height - offset,           // Bottom-left corner
    0, offset,                    // Top-left corner
  ];

  const finalTextColor = textColor || getContrastTextColor(fill);

  return (
    <>
      <Line
        ref={shapeRef}
        id={id}
        x={x}
        y={y}
        points={points}
        closed
        fill={fill}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        opacity={opacity / 100}
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
      {text && (
        <KonvaText
          x={x}
          y={y + (height - fontSize) / 2}
          width={width}
          height={fontSize * 1.2}
          text={text}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={`${fontStyle} ${fontWeight}`}
          textDecoration={textDecoration}
          align={textAlign}
          verticalAlign={verticalAlign}
          fill={finalTextColor}
          listening={false}
          rotation={rotation}
          scaleX={scaleX}
          scaleY={scaleY}
        />
      )}
    </>
  );
};

export default React.memo(Octagon);

