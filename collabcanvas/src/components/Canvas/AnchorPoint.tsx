import React, { useState, useEffect, useRef } from 'react';
import { Circle, Group } from 'react-konva';
import type Konva from 'konva';
import type { Shape, AnchorPosition } from '../../utils/types';
import { getAnchorPosition, getAllAnchors, ANCHOR_POINT_RADIUS } from '../../utils/anchor-snapping';

interface AnchorPointProps {
  shape: Shape;
  anchor: AnchorPosition;
  isHighlighted?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * AnchorPoint Component
 * Visualizes anchor points on shapes for connection creation
 * Shows small circles at connection points
 * 
 * @param props - AnchorPoint properties
 */
const AnchorPoint: React.FC<AnchorPointProps> = ({
  shape,
  anchor,
  isHighlighted = false,
  isActive = false,
  onClick,
}) => {
  const position = getAnchorPosition(shape, anchor);
  
  const handleClick = (e: any) => {
    e.cancelBubble = true;
    if (onClick) {
      onClick();
    }
  };
  
  // Determine visual style based on state
  const radius = isHighlighted || isActive ? ANCHOR_POINT_RADIUS * 1.5 : ANCHOR_POINT_RADIUS;
  const fill = isActive ? '#10b981' : (isHighlighted ? '#3b82f6' : '#6b7280');
  const stroke = '#ffffff';
  const strokeWidth = 2;
  
  return (
    <Group>
      {/* Outer glow for highlighted/active state */}
      {(isHighlighted || isActive) && (
        <Circle
          x={position.x}
          y={position.y}
          radius={radius + 4}
          fill={isActive ? '#10b981' : '#3b82f6'}
          opacity={0.2}
          listening={false}
        />
      )}
      
      {/* Main anchor point */}
      <Circle
        x={position.x}
        y={position.y}
        radius={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={handleClick}
        onTap={handleClick}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffsetY={2}
        name={`anchor-${shape.id}`}
      />
    </Group>
  );
};

/**
 * Render all anchor points for a shape with real-time position tracking
 */
interface ShapeAnchorsProps {
  shape: Shape;
  konvaNode?: Konva.Node | null;
  highlightedAnchor?: AnchorPosition | null;
  activeAnchor?: AnchorPosition | null;
  onAnchorClick?: (anchor: AnchorPosition) => void;
}

export const ShapeAnchors: React.FC<ShapeAnchorsProps> = ({
  shape,
  konvaNode,
  highlightedAnchor,
  activeAnchor,
  onAnchorClick,
}) => {
  const [liveShape, setLiveShape] = useState<Shape>(shape);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get shape-specific anchors
  const anchors = getAllAnchors(shape).map(a => a.anchor);
  
  // Track real-time position of the Konva node during dragging
  useEffect(() => {
    if (!konvaNode) {
      setLiveShape(shape);
      return;
    }
    
    const updatePosition = () => {
      // Get real-time position from Konva node
      const nodePos = konvaNode.position();
      const nodeAttrs = konvaNode.getAttrs();
      
      // For decision diamonds and circles, the Konva node is positioned at center, not top-left
      // We need to convert back to top-left corner for anchor calculations
      let adjustedX = nodePos.x;
      let adjustedY = nodePos.y;
      
      if (shape.type === 'decision') {
        // Decision diamond Group is at center, convert to top-left
        adjustedX = nodePos.x - shape.width / 2;
        adjustedY = nodePos.y - shape.height / 2;
      } else if (shape.type === 'circle') {
        // Circle is positioned at center, convert to top-left
        const radius = shape.radius || shape.width / 2;
        adjustedX = nodePos.x - radius;
        adjustedY = nodePos.y - radius;
      } else if (shape.type === 'ellipse') {
        // Ellipse is positioned at center, convert to top-left
        adjustedX = nodePos.x - shape.width / 2;
        adjustedY = nodePos.y - shape.height / 2;
      }
      
      // Update shape with live position
      setLiveShape({
        ...shape,
        x: adjustedX,
        y: adjustedY,
        rotation: nodeAttrs.rotation || shape.rotation,
        scaleX: nodeAttrs.scaleX || shape.scaleX,
        scaleY: nodeAttrs.scaleY || shape.scaleY,
      });
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updatePosition);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [konvaNode, shape]);
  
  return (
    <Group>
      {anchors.map(anchor => (
        <AnchorPoint
          key={`${shape.id}-${anchor}`}
          shape={liveShape}
          anchor={anchor}
          isHighlighted={highlightedAnchor === anchor}
          isActive={activeAnchor === anchor}
          onClick={() => onAnchorClick?.(anchor)}
        />
      ))}
    </Group>
  );
};

export default AnchorPoint;

