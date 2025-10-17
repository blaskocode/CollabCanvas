import React, { useState, useEffect, useRef } from 'react';
import { Arrow, Group, Text as KonvaText, Rect } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Connection, Shape, ArrowType } from '../../../utils/types';
import { getAnchorPosition } from '../../../utils/anchor-snapping';

interface ConnectorProps {
  connection: Connection;
  shapes: Shape[];
  shapeNodes?: Map<string, Konva.Node>;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
}

/**
 * Connector Component
 * Renders a smart connector (arrow) between two shapes
 * Automatically updates position when connected shapes move
 * Uses real-time position tracking for smooth updates during dragging
 * 
 * @param props - Connector properties
 */
const Connector: React.FC<ConnectorProps> = ({
  connection,
  shapes,
  shapeNodes,
  isSelected,
  onSelect,
  onContextMenu,
}) => {
  const groupRef = React.useRef<Konva.Group>(null);
  
  // Find the connected shapes
  const fromShapeBase = shapes.find(s => s.id === connection.fromShapeId);
  const toShapeBase = shapes.find(s => s.id === connection.toShapeId);
  
  // State for live shapes (updated during dragging)
  const [fromShape, setFromShape] = useState<Shape | undefined>(fromShapeBase);
  const [toShape, setToShape] = useState<Shape | undefined>(toShapeBase);
  const animationFrameRef = useRef<number | null>(null);
  
  // Track real-time positions of connected shapes during dragging
  useEffect(() => {
    if (!shapeNodes || !fromShapeBase || !toShapeBase) {
      setFromShape(fromShapeBase);
      setToShape(toShapeBase);
      return;
    }
    
    const fromNode = shapeNodes.get(connection.fromShapeId);
    const toNode = shapeNodes.get(connection.toShapeId);
    
    if (!fromNode || !toNode) {
      setFromShape(fromShapeBase);
      setToShape(toShapeBase);
      return;
    }
    
    const updatePositions = () => {
      // Get real-time positions from Konva nodes
      const fromNodePos = fromNode.position();
      const fromNodeAttrs = fromNode.getAttrs();
      const toNodePos = toNode.position();
      const toNodeAttrs = toNode.getAttrs();
      
      // For decision diamonds and circles, the Konva node is positioned at center, not top-left
      // We need to convert back to top-left corner for anchor calculations
      let fromX = fromNodePos.x;
      let fromY = fromNodePos.y;
      let toX = toNodePos.x;
      let toY = toNodePos.y;
      
      if (fromShapeBase.type === 'decision') {
        fromX = fromNodePos.x - fromShapeBase.width / 2;
        fromY = fromNodePos.y - fromShapeBase.height / 2;
      } else if (fromShapeBase.type === 'circle') {
        const radius = fromShapeBase.radius || fromShapeBase.width / 2;
        fromX = fromNodePos.x - radius;
        fromY = fromNodePos.y - radius;
      }
      
      if (toShapeBase.type === 'decision') {
        toX = toNodePos.x - toShapeBase.width / 2;
        toY = toNodePos.y - toShapeBase.height / 2;
      } else if (toShapeBase.type === 'circle') {
        const radius = toShapeBase.radius || toShapeBase.width / 2;
        toX = toNodePos.x - radius;
        toY = toNodePos.y - radius;
      }
      
      // Update shapes with live positions
      setFromShape({
        ...fromShapeBase,
        x: fromX,
        y: fromY,
        rotation: fromNodeAttrs.rotation || fromShapeBase.rotation,
        scaleX: fromNodeAttrs.scaleX || fromShapeBase.scaleX,
        scaleY: fromNodeAttrs.scaleY || fromShapeBase.scaleY,
      });
      
      setToShape({
        ...toShapeBase,
        x: toX,
        y: toY,
        rotation: toNodeAttrs.rotation || toShapeBase.rotation,
        scaleX: toNodeAttrs.scaleX || toShapeBase.scaleX,
        scaleY: toNodeAttrs.scaleY || toShapeBase.scaleY,
      });
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updatePositions);
    };
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updatePositions);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shapeNodes, fromShapeBase, toShapeBase, connection.fromShapeId, connection.toShapeId]);
  
  // If either shape is missing, don't render
  if (!fromShape || !toShape) {
    return null;
  }
  
  // Calculate anchor positions
  const fromPos = getAnchorPosition(fromShape, connection.fromAnchor);
  const toPos = getAnchorPosition(toShape, connection.toAnchor);
  
  /**
   * Handle connector click to select
   */
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
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
  
  // Determine stroke color based on selection
  const strokeColor = isSelected ? '#2563eb' : (connection.stroke || '#000000');
  const strokeWidth = connection.strokeWidth || 2;
  
  // Calculate points for arrow
  const points = [fromPos.x, fromPos.y, toPos.x, toPos.y];
  
  // Determine if we should show arrows
  const pointerLength = 10;
  const pointerWidth = 10;
  
  const showPointerAtEnd = connection.arrowType === 'end' || connection.arrowType === 'both';
  const showPointerAtStart = connection.arrowType === 'both';
  
  // Calculate label position (midpoint of line)
  const labelX = (fromPos.x + toPos.x) / 2;
  const labelY = (fromPos.y + toPos.y) / 2;
  
  // Calculate label offset perpendicular to line
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;
  const labelOffsetDistance = 20;
  
  return (
    <Group ref={groupRef}>
      {/* Main arrow line */}
      <Arrow
        points={points}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={strokeColor}
        pointerLength={showPointerAtEnd ? pointerLength : 0}
        pointerWidth={showPointerAtEnd ? pointerWidth : 0}
        pointerAtBeginning={showPointerAtStart}
        hitStrokeWidth={Math.max(strokeWidth, 12)} // Larger hit area for easier selection
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        shadowColor={isSelected ? '#2563eb' : 'transparent'}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
      />
      
      {/* Label (if exists) */}
      {connection.label && (
        <Group
          x={labelX + perpX * labelOffsetDistance}
          y={labelY + perpY * labelOffsetDistance}
        >
          {/* Label background */}
          <Rect
            x={-25}
            y={-12}
            width={50}
            height={24}
            fill="#ffffff"
            stroke="#e5e7eb"
            strokeWidth={1}
            cornerRadius={4}
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
          
          {/* Label text */}
          <KonvaText
            text={connection.label}
            fontSize={14}
            fontFamily="Arial, sans-serif"
            fill="#000000"
            width={50}
            height={24}
            align="center"
            verticalAlign="middle"
            x={-25}
            y={-12}
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(Connector, (prevProps, nextProps) => {
  // Custom comparison - only re-render if connection, shapes positions, or selection changed
  const prevFromShape = prevProps.shapes.find(s => s.id === prevProps.connection.fromShapeId);
  const nextFromShape = nextProps.shapes.find(s => s.id === nextProps.connection.fromShapeId);
  const prevToShape = prevProps.shapes.find(s => s.id === prevProps.connection.toShapeId);
  const nextToShape = nextProps.shapes.find(s => s.id === nextProps.connection.toShapeId);
  
  // Check if connection properties changed
  if (
    prevProps.connection.id !== nextProps.connection.id ||
    prevProps.connection.stroke !== nextProps.connection.stroke ||
    prevProps.connection.strokeWidth !== nextProps.connection.strokeWidth ||
    prevProps.connection.arrowType !== nextProps.connection.arrowType ||
    prevProps.connection.label !== nextProps.connection.label ||
    prevProps.isSelected !== nextProps.isSelected
  ) {
    return false; // Re-render
  }
  
  // Check if shape positions changed
  if (
    prevFromShape?.x !== nextFromShape?.x ||
    prevFromShape?.y !== nextFromShape?.y ||
    prevToShape?.x !== nextToShape?.x ||
    prevToShape?.y !== nextToShape?.y
  ) {
    return false; // Re-render
  }
  
  return true; // Don't re-render
});

