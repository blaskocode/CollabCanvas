import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import { useCursors } from '../../hooks/useCursors';
import { useToast } from '../../hooks/useToast';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, AUTO_PAN_EDGE_THRESHOLD, AUTO_PAN_SPEED_MAX, AUTO_PAN_SPEED_MIN } from '../../utils/constants';
import CanvasControls from './CanvasControls';
import Shape from './Shape';
import Cursor from '../Collaboration/Cursor';
import type { KonvaEventObject } from 'konva/lib/Node';

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

  // Dynamic minimum zoom - calculated to fit entire canvas in viewport
  const [minZoom, setMinZoom] = useState(MIN_ZOOM);

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

  // Update dimensions and calculate minimum zoom on window resize
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight - 64,
      };
      setDimensions(newDimensions);

      // Calculate minimum zoom to fit entire canvas in viewport
      // Take the smaller of the two ratios to ensure entire canvas is visible
      // This allows seeing the full larger dimension, with empty space on the smaller dimension
      const calculatedMinZoom = Math.min(
        newDimensions.width / CANVAS_WIDTH,
        newDimensions.height / CANVAS_HEIGHT
      );
      setMinZoom(calculatedMinZoom);

      // If current zoom is below new minimum, adjust it and center the canvas
      setStageScale(prevScale => {
        const newScale = Math.max(prevScale, calculatedMinZoom);
        
        // If we're at minimum zoom, center the canvas
        if (newScale === calculatedMinZoom) {
          centerCanvasAtMinZoom(newDimensions, calculatedMinZoom);
        }
        
        return newScale;
      });
    };

    // Calculate initial minimum zoom
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

        // Constrain position to keep canvas visible
        const padding = 100;
        const scale = stageScale;
        
        const maxX = padding;
        const maxY = padding;
        const minX = -(CANVAS_WIDTH * scale - dimensions.width + padding);
        const minY = -(CANVAS_HEIGHT * scale - dimensions.height + padding);

        // Apply constraints
        if (newPos.x > maxX) newPos.x = maxX;
        if (newPos.x < minX) newPos.x = minX;
        if (newPos.y > maxY) newPos.y = maxY;
        if (newPos.y < minY) newPos.y = minY;

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
   * Constrains panning to canvas bounds
   */
  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target;
    const newPos = {
      x: stage.x(),
      y: stage.y(),
    };

    // Constrain position to keep canvas visible
    // Allow some padding so user can see edges
    const padding = 100;
    const scale = stage.scaleX();
    
    const maxX = padding;
    const maxY = padding;
    const minX = -(CANVAS_WIDTH * scale - dimensions.width + padding);
    const minY = -(CANVAS_HEIGHT * scale - dimensions.height + padding);

    // Apply constraints
    if (newPos.x > maxX) newPos.x = maxX;
    if (newPos.x < minX) newPos.x = minX;
    if (newPos.y > maxY) newPos.y = maxY;
    if (newPos.y < minY) newPos.y = minY;

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

    // Constrain zoom to min/max (using dynamic minimum zoom)
    if (newScale < minZoom) newScale = minZoom;
    if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

    setStageScale(newScale);

    // If we're at minimum zoom, center the canvas
    if (newScale === minZoom) {
      centerCanvasAtMinZoom(dimensions, newScale);
    } else {
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
    }
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
    if (newScale < minZoom) newScale = minZoom;

    setStageScale(newScale);

    // If we're at minimum zoom, center the canvas
    if (newScale === minZoom) {
      centerCanvasAtMinZoom(dimensions, newScale);
    } else {
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
    }
  };

  /**
   * Reset view to minimum zoom with canvas centered
   */
  const handleResetView = () => {
    setStageScale(minZoom);
    centerCanvasAtMinZoom(dimensions, minZoom);
  };

  /**
   * Handle add shape button click
   * Creates a shape at the center of the current viewport
   * Ensures shape is created wholly within canvas boundaries
   */
  const handleAddShape = () => {
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

    addShape('rectangle', { x: constrainedX, y: constrainedY });
  };

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
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill}
              isSelected={shape.id === selectedId}
              isLocked={shape.isLocked}
              lockedBy={shape.lockedBy}
              currentUserId={currentUser?.uid || null}
              onSelect={() => selectShape(shape.id)}
              onDragStart={() => handleShapeDragStart(shape.id)}
              onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
            />
          ))}
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

      {/* Canvas Controls */}
      <CanvasControls
        zoom={stageScale}
        minZoom={minZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onAddShape={handleAddShape}
      />
    </div>
  );
};

export default Canvas;

