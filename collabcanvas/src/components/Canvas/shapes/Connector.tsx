import React, { useState, useEffect, useRef } from 'react';
import { Arrow, Line, Group, Text as KonvaText, Rect, Circle as KonvaCircle } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Connection, Shape } from '../../../utils/types';
import { getAnchorPosition, findSnappableAnchor } from '../../../utils/anchor-snapping';

interface ConnectorProps {
  connection: Connection;
  shapes: Shape[];
  shapeNodes?: Map<string, Konva.Node>;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu?: (e: KonvaEventObject<PointerEvent>) => void;
  onUpdateConnection?: (updates: Partial<Connection>) => void;
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
  onUpdateConnection,
}) => {
  const groupRef = React.useRef<Konva.Group>(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [liveEndpoints, setLiveEndpoints] = useState<{ start?: { x: number; y: number }; end?: { x: number; y: number } }>({});
  const [startEndpointVersion, setStartEndpointVersion] = useState(0); // Force re-render of start endpoint
  const [endEndpointVersion, setEndEndpointVersion] = useState(0); // Force re-render of end endpoint
  
  // Find the connected shapes (may be undefined for free-floating endpoints)
  const fromShapeBase = connection.fromShapeId ? shapes.find(s => s.id === connection.fromShapeId) : undefined;
  const toShapeBase = connection.toShapeId ? shapes.find(s => s.id === connection.toShapeId) : undefined;
  
  // State for live shapes (updated during dragging)
  const [fromShape, setFromShape] = useState<Shape | undefined>(fromShapeBase);
  const [toShape, setToShape] = useState<Shape | undefined>(toShapeBase);
  const animationFrameRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const liveEndpointTimeoutRef = useRef<{ start?: NodeJS.Timeout; end?: NodeJS.Timeout }>({});
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (liveEndpointTimeoutRef.current.start) {
        clearTimeout(liveEndpointTimeoutRef.current.start);
      }
      if (liveEndpointTimeoutRef.current.end) {
        clearTimeout(liveEndpointTimeoutRef.current.end);
      }
    };
  }, []);
  
  // Clear live start endpoint when FROM connection data updates from Firestore
  useEffect(() => {
    // Only clear start endpoint if we're not dragging it
    if (isDraggingEndpoint !== 'start') {
      // Clear any pending timeout for start endpoint
      if (liveEndpointTimeoutRef.current.start) {
        clearTimeout(liveEndpointTimeoutRef.current.start);
        liveEndpointTimeoutRef.current.start = undefined;
      }
      
      setLiveEndpoints(prev => {
        // Only clear start, preserve end
        const newState = { ...prev };
        delete newState.start;
        return newState;
      });
    }
  }, [connection.fromShapeId, connection.fromAnchor, connection.fromPoint, isDraggingEndpoint]);
  
  // Clear live end endpoint when TO connection data updates from Firestore
  useEffect(() => {
    // Only clear end endpoint if we're not dragging it
    if (isDraggingEndpoint !== 'end') {
      // Clear any pending timeout for end endpoint
      if (liveEndpointTimeoutRef.current.end) {
        clearTimeout(liveEndpointTimeoutRef.current.end);
        liveEndpointTimeoutRef.current.end = undefined;
      }
      
      setLiveEndpoints(prev => {
        // Only clear end, preserve start
        const newState = { ...prev };
        delete newState.end;
        return newState;
      });
    }
  }, [connection.toShapeId, connection.toAnchor, connection.toPoint, isDraggingEndpoint]);
  
  // Track real-time positions of connected shapes during dragging
  useEffect(() => {
    if (!shapeNodes || !fromShapeBase || !toShapeBase) {
      setFromShape(fromShapeBase);
      setToShape(toShapeBase);
      return;
    }
    
    const fromNode = connection.fromShapeId ? shapeNodes.get(connection.fromShapeId) : null;
    const toNode = connection.toShapeId ? shapeNodes.get(connection.toShapeId) : null;
    
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
  
  // Calculate endpoint positions
  let fromPos: { x: number; y: number };
  let toPos: { x: number; y: number };
  
  // From endpoint: use live position if dragging, otherwise calculate from connection data
  if (liveEndpoints.start) {
    fromPos = liveEndpoints.start;
  } else if (fromShape && connection.fromShapeId && connection.fromAnchor) {
    fromPos = getAnchorPosition(fromShape, connection.fromAnchor);
  } else if (connection.fromPoint) {
    fromPos = connection.fromPoint;
  } else {
    // Fallback: default position
    fromPos = { x: 100, y: 100 };
  }
  
  // To endpoint: use live position if dragging, otherwise calculate from connection data
  if (liveEndpoints.end) {
    toPos = liveEndpoints.end;
  } else if (toShape && connection.toShapeId && connection.toAnchor) {
    toPos = getAnchorPosition(toShape, connection.toAnchor);
  } else if (connection.toPoint) {
    toPos = connection.toPoint;
  } else {
    // Fallback: default position
    toPos = { x: 200, y: 200 };
  }
  
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
  
  /**
   * Handle mouse enter - show endpoint handles
   */
  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };
  
  /**
   * Handle mouse leave - hide endpoint handles with delay (unless dragging)
   */
  const handleMouseLeave = () => {
    // Don't hide handles if we're dragging an endpoint
    if (!isDraggingEndpoint) {
      // Use a small delay to prevent flashing when moving between arrow and handles
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        hoverTimeoutRef.current = null;
      }, 50);
    }
  };
  
  /**
   * Handle endpoint drag start
   */
  const handleEndpointDragStart = (endpoint: 'start' | 'end') => {
    setIsDraggingEndpoint(endpoint);
    setIsHovered(true); // Keep hovered state during drag
  };
  
  /**
   * Handle endpoint drag move - show snap indicator and update live position
   */
  const handleEndpointDragMove = (endpoint: 'start' | 'end', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    
    // Update ONLY the endpoint being dragged, preserve the other
    if (endpoint === 'start') {
      setLiveEndpoints(prev => ({ 
        start: { x: newX, y: newY },
        // Explicitly preserve end if it exists
        ...(prev.end ? { end: prev.end } : {})
      }));
    } else {
      setLiveEndpoints(prev => ({ 
        end: { x: newX, y: newY },
        // Explicitly preserve start if it exists
        ...(prev.start ? { start: prev.start } : {})
      }));
    }
    
    // Check for nearby anchor points
    const snappableAnchor = findSnappableAnchor(shapes, newX, newY);
    
    if (snappableAnchor) {
      setSnapIndicator({ x: snappableAnchor.x, y: snappableAnchor.y });
    } else {
      setSnapIndicator(null);
    }
  };
  
  /**
   * Handle endpoint drag end - update connection
   */
  const handleEndpointDragEnd = (endpoint: 'start' | 'end', e: KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    
    const node = e.target;
    const newX = node.x();
    const newY = node.y();
    
    setIsDraggingEndpoint(null);
    setSnapIndicator(null);
    
    if (!onUpdateConnection) return;
    
    // Check for nearby anchor points
    const snappableAnchor = findSnappableAnchor(shapes, newX, newY);
    
    const updates: Partial<Connection> = {};
    let finalPosition: { x: number; y: number };
    
    if (endpoint === 'start') {
      if (snappableAnchor) {
        // Snap to anchor
        updates.fromShapeId = snappableAnchor.shapeId;
        updates.fromAnchor = snappableAnchor.anchor;
        updates.fromPoint = undefined;
        // Use the anchor position as final position
        finalPosition = { x: snappableAnchor.x, y: snappableAnchor.y };
      } else {
        // Free-floating
        updates.fromShapeId = undefined;
        updates.fromAnchor = undefined;
        updates.fromPoint = { x: newX, y: newY };
        finalPosition = { x: newX, y: newY };
      }
      // Update live endpoint to final position immediately, preserve the other
      setLiveEndpoints(prev => ({ 
        start: finalPosition,
        ...(prev.end ? { end: prev.end } : {})
      }));
      
      // Set a safety timeout to clear this endpoint if Firebase doesn't update within 5 seconds
      if (liveEndpointTimeoutRef.current.start) {
        clearTimeout(liveEndpointTimeoutRef.current.start);
      }
      liveEndpointTimeoutRef.current.start = setTimeout(() => {
        setLiveEndpoints(prev => {
          const newState = { ...prev };
          delete newState.start;
          return newState;
        });
        liveEndpointTimeoutRef.current.start = undefined;
      }, 5000);
    } else {
      if (snappableAnchor) {
        // Snap to anchor
        updates.toShapeId = snappableAnchor.shapeId;
        updates.toAnchor = snappableAnchor.anchor;
        updates.toPoint = undefined;
        // Use the anchor position as final position
        finalPosition = { x: snappableAnchor.x, y: snappableAnchor.y };
      } else {
        // Free-floating
        updates.toShapeId = undefined;
        updates.toAnchor = undefined;
        updates.toPoint = { x: newX, y: newY };
        finalPosition = { x: newX, y: newY };
      }
      // Update live endpoint to final position immediately, preserve the other
      setLiveEndpoints(prev => ({ 
        end: finalPosition,
        ...(prev.start ? { start: prev.start } : {})
      }));
      
      // Set a safety timeout to clear this endpoint if Firebase doesn't update within 5 seconds
      if (liveEndpointTimeoutRef.current.end) {
        clearTimeout(liveEndpointTimeoutRef.current.end);
      }
      liveEndpointTimeoutRef.current.end = setTimeout(() => {
        setLiveEndpoints(prev => {
          const newState = { ...prev };
          delete newState.end;
          return newState;
        });
        liveEndpointTimeoutRef.current.end = undefined;
      }, 5000);
    }
    
    onUpdateConnection(updates);
  };
  
  // Determine stroke color based on selection
  const strokeColor = isSelected ? '#2563eb' : (connection.stroke || '#000000');
  const strokeWidth = connection.strokeWidth || 2;
  
  // Determine if we should show arrows
  const pointerLength = 10;
  const pointerWidth = 10;
  
  // Support both old arrowType format and new arrowStart/arrowEnd flags
  // MUST match the logic in PropertyPanel.tsx for consistency
  let showPointerAtEnd = false;
  let showPointerAtStart = false;
  
  // Check if using new format (explicit arrowStart/arrowEnd)
  const hasNewFormat = connection.arrowStart !== undefined || connection.arrowEnd !== undefined;
  
  if (hasNewFormat) {
    // New format: use explicit boolean values
    // If a value is undefined in the new format, treat it as false (not as "use default")
    showPointerAtStart = connection.arrowStart === true;
    showPointerAtEnd = connection.arrowEnd === true;
  } else if (connection.arrowType !== undefined) {
    // Legacy format: use arrowType
    showPointerAtStart = connection.arrowType === 'both';
    showPointerAtEnd = connection.arrowType === 'end' || connection.arrowType === 'both';
  } else {
    // No arrow properties set: default to end arrow only (legacy behavior)
    showPointerAtStart = false;
    showPointerAtEnd = true;
  }
  
  // Calculate points for arrow
  // If we only want a start arrow, reverse the points so the arrow appears at the start
  const points = (showPointerAtStart && !showPointerAtEnd) 
    ? [toPos.x, toPos.y, fromPos.x, fromPos.y]  // Reversed for start arrow only
    : [fromPos.x, fromPos.y, toPos.x, toPos.y]; // Normal direction
  
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
      {/* Main line/arrow - Always use Arrow component for consistent rendering */}
      {(showPointerAtEnd || showPointerAtStart) ? (
        /* Arrow with pointer(s) */
        <Arrow
          points={points}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={strokeColor}
          pointerLength={pointerLength}
          pointerWidth={pointerWidth}
          // When both arrows: use pointerAtBeginning for the start arrow
          // When start only: points are reversed, so just use default end arrow
          // When end only: just use default end arrow
          pointerAtBeginning={showPointerAtStart && showPointerAtEnd}
          hitStrokeWidth={Math.max(strokeWidth, 12)} // Larger hit area for easier selection
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          shadowColor={isSelected ? '#2563eb' : 'transparent'}
          shadowBlur={isSelected ? 8 : 0}
          shadowOpacity={isSelected ? 0.5 : 0}
        />
      ) : (
        /* Plain line with no arrows */
        <Line
          points={points}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          hitStrokeWidth={Math.max(strokeWidth, 12)} // Larger hit area for easier selection
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
          shadowColor={isSelected ? '#2563eb' : 'transparent'}
          shadowBlur={isSelected ? 8 : 0}
          shadowOpacity={isSelected ? 0.5 : 0}
        />
      )}
      
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
      
      {/* Endpoint handles (when selected or hovered) */}
      {(isSelected || isHovered) && (
        <>
          {/* Start endpoint handle */}
          <KonvaCircle
            key={`start-${connection.id}-${startEndpointVersion}`}
            x={fromPos.x}
            y={fromPos.y}
            radius={8}
            fill={connection.fromShapeId ? '#10b981' : '#f59e0b'}
            stroke="#ffffff"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => handleEndpointDragStart('start')}
            onDragMove={(e) => handleEndpointDragMove('start', e)}
            onDragEnd={(e) => handleEndpointDragEnd('start', e)}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
          
          {/* End endpoint handle */}
          <KonvaCircle
            key={`end-${connection.id}-${endEndpointVersion}`}
            x={toPos.x}
            y={toPos.y}
            radius={8}
            fill={connection.toShapeId ? '#10b981' : '#f59e0b'}
            stroke="#ffffff"
            strokeWidth={2}
            draggable={true}
            onDragStart={() => handleEndpointDragStart('end')}
            onDragMove={(e) => handleEndpointDragMove('end', e)}
            onDragEnd={(e) => handleEndpointDragEnd('end', e)}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={4}
            shadowOffsetY={2}
          />
        </>
      )}
      
      {/* Snap indicator (when dragging endpoint near an anchor) */}
      {snapIndicator && (
        <>
          {/* Outer glow */}
          <KonvaCircle
            x={snapIndicator.x}
            y={snapIndicator.y}
            radius={16}
            fill="#3b82f6"
            opacity={0.2}
            listening={false}
          />
          {/* Inner circle */}
          <KonvaCircle
            x={snapIndicator.x}
            y={snapIndicator.y}
            radius={10}
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth={3}
            listening={false}
          />
        </>
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
    prevProps.connection.arrowStart !== nextProps.connection.arrowStart ||
    prevProps.connection.arrowEnd !== nextProps.connection.arrowEnd ||
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

