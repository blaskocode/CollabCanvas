import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import { useCursors } from '../../hooks/useCursors';
import { useToast } from '../../hooks/useToast';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, AUTO_PAN_EDGE_THRESHOLD, AUTO_PAN_SPEED_MAX, AUTO_PAN_SPEED_MIN } from '../../utils/constants';
import CanvasControls from './CanvasControls';
import PropertyPanel from './PropertyPanel';
import Shape from './Shape';
import Rectangle from './shapes/Rectangle';
import Circle from './shapes/Circle';
import Text from './shapes/Text';
import Line from './shapes/Line';
import Cursor from '../Collaboration/Cursor';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Shape as ShapeType } from '../../utils/types';

/**
 * Canvas Component
 * Main canvas component with Konva Stage and Layer
 * Handles pan, zoom, and shape rendering
 */
const Canvas: React.FC = () => {
  const { shapes, selectedId, loading, stageRef, selectShape, addShape, updateShape, deleteShape } = useCanvasContext();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Multiplayer cursors
  const { cursors, updateCursor } = useCursors(
    currentUser?.uid || null,
    currentUser?.displayName || currentUser?.email || null,
    !!currentUser
  );
  
  // Viewport dimensions (dynamically calculated from window size)
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 64, // Subtract navbar height (64px)
  });

  // Stage position and scale for pan/zoom
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  // Auto-pan state for shape dragging near viewport edges
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const autoPanFrameId = useRef<number | null>(null);

  /**
   * Center the canvas in the viewport at minimum zoom
   * Calculates the position to center the canvas based on which dimension has extra space
   */
  const centerCanvasAtMinZoom = (dims: { width: number; height: number }, zoom: number) => {
    const scaledCanvasWidth = CANVAS_WIDTH * zoom;
    const scaledCanvasHeight = CANVAS_HEIGHT * zoom;

    // Calculate centering offsets
    const xOffset = dims.width > scaledCanvasWidth ? (dims.width - scaledCanvasWidth) / 2 : 0;
    const yOffset = dims.height > scaledCanvasHeight ? (dims.height - scaledCanvasHeight) / 2 : 0;

    setStagePos({ x: xOffset, y: yOffset });
  };

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight - 64,
      };
      setDimensions(newDimensions);

      // If current zoom is below minimum, adjust it
      setStageScale(prevScale => Math.max(prevScale, MIN_ZOOM));
    };

    // Set initial dimensions
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard listener for delete and escape functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key: deselect current selection
      if (e.key === 'Escape') {
        if (selectedId) {
          selectShape(null);
        }
        return;
      }

      // Check if Delete or Backspace key was pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent default browser behavior (e.g., going back in history)
        e.preventDefault();

        // Check if a shape is selected
        if (selectedId) {
          const selectedShape = shapes.find((shape) => shape.id === selectedId);
          
          if (selectedShape) {
            // Check if shape is locked by another user (not current user)
            const isLockedByOtherUser = selectedShape.isLocked && 
                                        selectedShape.lockedBy && 
                                        selectedShape.lockedBy !== currentUser?.uid;
            
            if (isLockedByOtherUser) {
              toast.error('Cannot delete: This shape is locked by another user');
              return;
            }

            // Delete the shape
            deleteShape(selectedId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, deleteShape, selectShape, toast, currentUser]);

  /**
   * Auto-pan effect when dragging shapes near viewport edges
   * Uses requestAnimationFrame for smooth 60fps updates
   */
  useEffect(() => {
    if (!isDraggingShape) {
      // Cancel any ongoing auto-pan when not dragging
      if (autoPanFrameId.current !== null) {
        cancelAnimationFrame(autoPanFrameId.current);
        autoPanFrameId.current = null;
      }
      return;
    }

    // Auto-pan loop function
    const autoPan = () => {
      const stage = stageRef?.current;
      if (!stage) {
        autoPanFrameId.current = requestAnimationFrame(autoPan);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        autoPanFrameId.current = requestAnimationFrame(autoPan);
        return;
      }

      // Calculate distance from viewport edges
      const distanceFromLeft = pointer.x;
      const distanceFromRight = dimensions.width - pointer.x;
      const distanceFromTop = pointer.y;
      const distanceFromBottom = dimensions.height - pointer.y;

      let panX = 0;
      let panY = 0;

      // Check if near left edge
      if (distanceFromLeft < AUTO_PAN_EDGE_THRESHOLD) {
        const intensity = 1 - (distanceFromLeft / AUTO_PAN_EDGE_THRESHOLD);
        panX = AUTO_PAN_SPEED_MIN + (AUTO_PAN_SPEED_MAX - AUTO_PAN_SPEED_MIN) * intensity;
      }
      // Check if near right edge
      else if (distanceFromRight < AUTO_PAN_EDGE_THRESHOLD) {
        const intensity = 1 - (distanceFromRight / AUTO_PAN_EDGE_THRESHOLD);
        panX = -(AUTO_PAN_SPEED_MIN + (AUTO_PAN_SPEED_MAX - AUTO_PAN_SPEED_MIN) * intensity);
      }

      // Check if near top edge
      if (distanceFromTop < AUTO_PAN_EDGE_THRESHOLD) {
        const intensity = 1 - (distanceFromTop / AUTO_PAN_EDGE_THRESHOLD);
        panY = AUTO_PAN_SPEED_MIN + (AUTO_PAN_SPEED_MAX - AUTO_PAN_SPEED_MIN) * intensity;
      }
      // Check if near bottom edge
      else if (distanceFromBottom < AUTO_PAN_EDGE_THRESHOLD) {
        const intensity = 1 - (distanceFromBottom / AUTO_PAN_EDGE_THRESHOLD);
        panY = -(AUTO_PAN_SPEED_MIN + (AUTO_PAN_SPEED_MAX - AUTO_PAN_SPEED_MIN) * intensity);
      }

      // Apply panning if near any edge
      if (panX !== 0 || panY !== 0) {
        const newPos = {
          x: stagePos.x + panX,
          y: stagePos.y + panY,
        };

        // Constrain position to keep canvas visible with context-aware logic
        const scale = stageScale;
        const scaledCanvasWidth = CANVAS_WIDTH * scale;
        const scaledCanvasHeight = CANVAS_HEIGHT * scale;

        // Horizontal constraints
        if (scaledCanvasWidth > dimensions.width) {
          const padding = 100;
          const maxX = padding;
          const minX = -(scaledCanvasWidth - dimensions.width + padding);
          
          if (newPos.x > maxX) newPos.x = maxX;
          if (newPos.x < minX) newPos.x = minX;
        } else {
          const maxX = dimensions.width - scaledCanvasWidth + 100;
          const minX = -100;
          
          if (newPos.x > maxX) newPos.x = maxX;
          if (newPos.x < minX) newPos.x = minX;
        }

        // Vertical constraints
        if (scaledCanvasHeight > dimensions.height) {
          const padding = 100;
          const maxY = padding;
          const minY = -(scaledCanvasHeight - dimensions.height + padding);
          
          if (newPos.y > maxY) newPos.y = maxY;
          if (newPos.y < minY) newPos.y = minY;
        } else {
          const maxY = dimensions.height - scaledCanvasHeight + 100;
          const minY = -100;
          
          if (newPos.y > maxY) newPos.y = maxY;
          if (newPos.y < minY) newPos.y = minY;
        }

        setStagePos(newPos);
      }

      // Continue the animation loop
      autoPanFrameId.current = requestAnimationFrame(autoPan);
    };

    // Start the auto-pan loop
    autoPanFrameId.current = requestAnimationFrame(autoPan);

    // Cleanup on unmount or when dragging stops
    return () => {
      if (autoPanFrameId.current !== null) {
        cancelAnimationFrame(autoPanFrameId.current);
        autoPanFrameId.current = null;
      }
    };
  }, [isDraggingShape, stagePos, stageScale, dimensions]);

  /**
   * Handle shape drag start - enables auto-pan
   */
  const handleShapeDragStart = useCallback((_shapeId: string) => {
    setIsDraggingShape(true);
  }, []);

  /**
   * Handle shape drag end - disables auto-pan and updates position
   */
  const handleShapeDragEnd = useCallback(async (shapeId: string, x: number, y: number) => {
    setIsDraggingShape(false);

    // Update shape position in Firestore
    try {
      await updateShape(shapeId, { x, y });
    } catch (error) {
      console.error('Error updating shape position:', error);
    }
  }, [updateShape]);

  /**
   * Handle mouse move to update cursor position
   * Converts screen coordinates to canvas coordinates accounting for pan/zoom
   */
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert screen coordinates to canvas coordinates
    // Account for stage position (pan) and scale (zoom)
    const canvasX = (pointerPos.x - stage.x()) / stage.scaleX();
    const canvasY = (pointerPos.y - stage.y()) / stage.scaleY();

    // Update cursor position in RTDB
    updateCursor(canvasX, canvasY);
  }, [updateCursor]);

  /**
   * Handle clicking on the stage background to deselect shapes
   */
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Check if clicked on empty area (stage itself)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  /**
   * Handle stage drag (pan functionality)
   * Constrains panning to canvas bounds with context-aware logic
   */
  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target;
    const newPos = {
      x: stage.x(),
      y: stage.y(),
    };

    const scale = stage.scaleX();
    const scaledCanvasWidth = CANVAS_WIDTH * scale;
    const scaledCanvasHeight = CANVAS_HEIGHT * scale;

    // Apply constraints based on whether canvas is larger than viewport
    // This ensures smooth panning at all zoom levels
    
    // Horizontal constraints
    if (scaledCanvasWidth > dimensions.width) {
      // Canvas is wider than viewport - keep some canvas visible
      const padding = 100;
      const maxX = padding;
      const minX = -(scaledCanvasWidth - dimensions.width + padding);
      
      if (newPos.x > maxX) newPos.x = maxX;
      if (newPos.x < minX) newPos.x = minX;
    } else {
      // Canvas fits within viewport - allow free positioning with gentle bounds
      const maxX = dimensions.width - scaledCanvasWidth + 100;
      const minX = -100;
      
      if (newPos.x > maxX) newPos.x = maxX;
      if (newPos.x < minX) newPos.x = minX;
    }

    // Vertical constraints
    if (scaledCanvasHeight > dimensions.height) {
      // Canvas is taller than viewport - keep some canvas visible
      const padding = 100;
      const maxY = padding;
      const minY = -(scaledCanvasHeight - dimensions.height + padding);
      
      if (newPos.y > maxY) newPos.y = maxY;
      if (newPos.y < minY) newPos.y = minY;
    } else {
      // Canvas fits within viewport - allow free positioning with gentle bounds
      const maxY = dimensions.height - scaledCanvasHeight + 100;
      const minY = -100;
      
      if (newPos.y > maxY) newPos.y = maxY;
      if (newPos.y < minY) newPos.y = minY;
    }

    setStagePos(newPos);
    stage.position(newPos);
  };

  /**
   * Handle mouse wheel for zoom functionality
   * Zooms toward cursor position
   */
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and amount
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    // Calculate new scale
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Constrain zoom to min/max
    if (newScale < MIN_ZOOM) newScale = MIN_ZOOM;
    if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

    setStageScale(newScale);

    // Calculate new position to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStagePos(newPos);
  };

  /**
   * Handle zoom in button click
   */
  const handleZoomIn = () => {
    const stage = stageRef?.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    let newScale = oldScale + ZOOM_STEP;
    if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

    // Zoom toward center of viewport
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  /**
   * Handle zoom out button click
   */
  const handleZoomOut = () => {
    const stage = stageRef?.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    let newScale = oldScale - ZOOM_STEP;
    if (newScale < MIN_ZOOM) newScale = MIN_ZOOM;

    setStageScale(newScale);

    // Zoom toward center of viewport
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    setStagePos(newPos);
  };

  /**
   * Reset view to minimum zoom with canvas centered
   */
  const handleResetView = () => {
    setStageScale(MIN_ZOOM);
    centerCanvasAtMinZoom(dimensions, MIN_ZOOM);
  };

  /**
   * Handle add shape button click
   * Creates a shape at the center of the current viewport
   * Ensures shape is created wholly within canvas boundaries
   */
  const handleAddShape = (type: ShapeType['type']) => {
    // Calculate center of current viewport in canvas coordinates
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    // Convert screen coordinates to canvas coordinates
    let canvasX = (center.x - stagePos.x) / stageScale;
    let canvasY = (center.y - stagePos.y) / stageScale;

    // Offset by half the shape size to center it
    canvasX -= DEFAULT_SHAPE_WIDTH / 2;
    canvasY -= DEFAULT_SHAPE_HEIGHT / 2;

    // Constrain position to keep shape fully within canvas boundaries
    // Ensure the shape's top-left corner is at least at (0, 0)
    // and bottom-right corner is at most at (CANVAS_WIDTH, CANVAS_HEIGHT)
    const constrainedX = Math.max(0, Math.min(canvasX, CANVAS_WIDTH - DEFAULT_SHAPE_WIDTH));
    const constrainedY = Math.max(0, Math.min(canvasY, CANVAS_HEIGHT - DEFAULT_SHAPE_HEIGHT));

    addShape(type, { x: constrainedX, y: constrainedY });
  };

  /**
   * Render shape based on type
   */
  const renderShapeByType = (shape: ShapeType, isSelected: boolean) => {
    const commonProps = {
      id: shape.id,
      isSelected,
      isLocked: shape.isLocked,
      lockedBy: shape.lockedBy,
      currentUserId: currentUser?.uid || null,
      onSelect: () => selectShape(shape.id),
      onDragStart: () => handleShapeDragStart(shape.id),
      onDragEnd: (x: number, y: number) => handleShapeDragEnd(shape.id, x, y),
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <Rectangle
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            cornerRadius={shape.cornerRadius}
          />
        );
      
      case 'circle':
        return (
          <Circle
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.radius || 50}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
          />
        );
      
      case 'text':
        return (
          <Text
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            text={shape.text || 'Click to edit'}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            onTextChange={async (newText) => {
              try {
                await updateShape(shape.id, { text: newText });
              } catch (error) {
                console.error('Error updating text:', error);
              }
            }}
          />
        );
      
      case 'line':
        return (
          <Line
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            points={shape.points || [0, 0, 100, 100]}
            stroke={shape.fill}
            strokeWidth={shape.strokeWidth}
            opacity={shape.opacity}
            onPointsChange={async (newPoints) => {
              try {
                await updateShape(shape.id, { points: newPoints });
              } catch (error) {
                console.error('Error updating line points:', error);
              }
            }}
          />
        );
      
      default:
        // Fallback to old Shape component for backward compatibility
        return (
          <Shape
            key={shape.id}
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
          />
        );
    }
  };

  // Get selected shape for property panel (must be before early return)
  const selectedShape = shapes.find((shape) => shape.id === selectedId) || null;

  /**
   * Handle property updates from PropertyPanel
   * IMPORTANT: Must be declared before any early returns to follow Rules of Hooks
   */
  const handlePropertyUpdate = useCallback(async (updates: Partial<ShapeType>) => {
    console.log('[Canvas] handlePropertyUpdate called:', { selectedId, updates });
    if (!selectedId) return;
    
    try {
      await updateShape(selectedId, updates);
      console.log('[Canvas] Shape updated successfully');
    } catch (error) {
      console.error('Error updating shape properties:', error);
      toast.error('Failed to update shape properties');
    }
  }, [selectedId, updateShape, toast]);

  // Show loading state while shapes are being fetched
  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 font-medium">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100 overflow-hidden relative">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={!isDraggingShape}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        <Layer>
          {/* Background grid or color can be added here */}
          {/* Render all shapes */}
          {shapes.map((shape) => renderShapeByType(shape, shape.id === selectedId))}
        </Layer>
      </Stage>

      {/* Other users' cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => {
        // Don't show current user's cursor
        if (userId === currentUser?.uid) return null;

        // Convert canvas coordinates to screen coordinates
        // Account for stage position (pan) and scale (zoom)
        const screenX = cursor.cursorX * stageScale + stagePos.x;
        const screenY = cursor.cursorY * stageScale + stagePos.y;

        return (
          <Cursor
            key={userId}
            x={screenX}
            y={screenY}
            color={cursor.cursorColor}
            name={cursor.displayName}
          />
        );
      })}

      {/* Property Panel (shows when shape selected) */}
      <PropertyPanel
        shape={selectedShape}
        onUpdate={handlePropertyUpdate}
      />

      {/* Canvas Controls */}
      <CanvasControls
        zoom={stageScale}
        minZoom={MIN_ZOOM}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onAddShape={handleAddShape}
      />
    </div>
  );
};

export default Canvas;

