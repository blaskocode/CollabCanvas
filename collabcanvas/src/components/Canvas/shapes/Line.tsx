import React from 'react';
import { Line as KonvaLine, Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

interface LineProps {
  id: string;
  x: number;
  y: number;
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  isSelected: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  currentUserId: string | null;
  isDraggingDisabled?: boolean;
  listening?: boolean;
  onSelect: (e?: any) => void;
  onDblClick?: (e?: any) => void;
  onDragStart?: () => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onPointsChange?: (points: [number, number, number, number]) => void;
  onContextMenu?: (e: any) => void;
  onRef?: (node: any) => void;
}

/**
 * Line Component
 * Renders a line shape with selection, dragging, and endpoint editing
 * 
 * @param props - Line properties
 */
const Line: React.FC<LineProps> = ({
  id,
  x,
  y,
  points,
  stroke = '#000000',
  strokeWidth = 2,
  opacity = 100,
  isSelected,
  isLocked,
  lockedBy,
  currentUserId,
  isDraggingDisabled: _isDraggingDisabled = false,
  listening = true,
  onSelect,
  onDblClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onPointsChange,
  onContextMenu,
  onRef,
}) => {
  const lineRef = React.useRef<Konva.Line>(null);
  const [isDraggingPoint, setIsDraggingPoint] = React.useState<number | null>(null);
  
  // Call onRef callback when ref changes
  React.useEffect(() => {
    if (onRef) {
      onRef(lineRef.current);
    }
  }, [onRef]);

  /**
   * Handle line click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(e);
  };

  /**
   * Handle line tap (mobile) to select
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
  const handleContextMenu = (e: any) => {
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

    // Calculate bounding box of line
    const [x1, y1, x2, y2] = points;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const lineWidth = maxX - minX;
    const lineHeight = maxY - minY;

    // Constrain to canvas boundaries
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - lineWidth));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - lineHeight));

    if (newX !== constrainedX || newY !== constrainedY) {
      node.position({ x: constrainedX, y: constrainedY });
    }

    onDragEnd(constrainedX, constrainedY);
  };

  /**
   * Constrain drag bounds during dragging and notify parent for multi-select/group drag
   */
  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();

    // Calculate bounding box
    const [x1, y1, x2, y2] = points;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const lineWidth = maxX - minX;
    const lineHeight = maxY - minY;

    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - lineWidth));
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - lineHeight));

    node.position({ x: constrainedX, y: constrainedY });
    
    // Notify parent for multi-select/group drag
    if (onDragMove) {
      onDragMove(constrainedX, constrainedY);
    }
  };

  /**
   * Handle endpoint drag start
   */
  const handlePointDragStart = (pointIndex: number) => {
    setIsDraggingPoint(pointIndex);
  };

  /**
   * Handle endpoint drag end
   */
  const handlePointDragEnd = (pointIndex: number, e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPoint(null);

    if (onPointsChange) {
      const node = e.target;
      const newX = node.x();
      const newY = node.y();

      // Update the specific point
      const newPoints: [number, number, number, number] = [...points];
      if (pointIndex === 0) {
        newPoints[0] = newX - x;
        newPoints[1] = newY - y;
      } else {
        newPoints[2] = newX - x;
        newPoints[3] = newY - y;
      }

      onPointsChange(newPoints);
    }
  };

  // Check if shape is locked by another user
  const isLockedByOtherUser = isLocked && lockedBy && lockedBy !== currentUserId;

  // Determine stroke color based on selection and lock state
  let finalStroke = stroke;
  let finalStrokeWidth = strokeWidth;

  if (isSelected) {
    finalStroke = '#2563eb'; // Blue for selected
    finalStrokeWidth = Math.max(strokeWidth, 3);
  }

  if (isLockedByOtherUser) {
    finalStroke = '#ef4444'; // Red for locked by another user
    finalStrokeWidth = Math.max(strokeWidth, 4);
  }

  return (
    <>
      <KonvaLine
        ref={lineRef}
        id={id}
        x={x}
        y={y}
        points={points}
        stroke={finalStroke}
        strokeWidth={finalStrokeWidth}
        hitStrokeWidth={Math.max(finalStrokeWidth, 12)} // Larger hit area for easier selection
        opacity={opacity / 100} // Convert 0-100 to 0-1
        draggable={!isLockedByOtherUser && isDraggingPoint === null}
        listening={listening}
        onClick={handleClick}
      onDblClick={handleDblClick}
        onTap={handleTap}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        lineCap="round"
        lineJoin="round"
      />
      {/* Start point handle */}
      {isSelected && !isLockedByOtherUser && (
        <>
          <KonvaCircle
            x={x + points[0]}
            y={y + points[1]}
            radius={6}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => handlePointDragStart(0)}
            onDragEnd={(e) => handlePointDragEnd(0, e)}
          />
          {/* End point handle */}
          <KonvaCircle
            x={x + points[2]}
            y={y + points[3]}
            radius={6}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => handlePointDragStart(1)}
            onDragEnd={(e) => handlePointDragEnd(1, e)}
          />
        </>
      )}
    </>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export default React.memo(Line);

