import React from 'react';
import { Ellipse as KonvaEllipse, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { getContrastTextColor } from '../../../utils/colorUtils';

interface EllipseProps {
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
  onRef?: (node: Konva.Ellipse | null) => void;
}

/**
 * Ellipse Component
 * Renders an ellipse with independent width and height
 * 
 * @param props - Ellipse properties
 */
const Ellipse: React.FC<EllipseProps> = ({
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
  const shapeRef = React.useRef<Konva.Ellipse>(null);
  
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

  const finalTextColor = textColor || getContrastTextColor(fill);

  // Ellipse is centered, so we need to position at center of bounding box
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return (
    <>
      <KonvaEllipse
        ref={shapeRef}
        id={id}
        x={centerX}
        y={centerY}
        radiusX={width / 2}
        radiusY={height / 2}
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
        onDragEnd={(e) => {
          // Adjust coordinates since ellipse is centered
          const node = e.target;
          const centerX = node.x();
          const centerY = node.y();
          const topLeftX = centerX - width / 2;
          const topLeftY = centerY - height / 2;
          onDragEnd(topLeftX, topLeftY);
        }}
        onDragMove={(e) => {
          if (onDragMove) {
            const node = e.target;
            const centerX = node.x();
            const centerY = node.y();
            const topLeftX = centerX - width / 2;
            const topLeftY = centerY - height / 2;
            onDragMove(topLeftX, topLeftY);
          }
        }}
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

export default React.memo(Ellipse);

