import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import { useCursors } from '../../hooks/useCursors';
import { useToast } from '../../hooks/useToast';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, AUTO_PAN_EDGE_THRESHOLD, AUTO_PAN_SPEED_MAX, AUTO_PAN_SPEED_MIN } from '../../utils/constants';
import CanvasControls from './CanvasControls';
import PropertyPanel from './PropertyPanel';
import AlignmentTools from './AlignmentTools';
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
  const { shapes, groups, selectedId, selectedIds, isSelected, loading, stageRef, selectShape, selectMultipleShapes, addShape, updateShape, deleteShape, lockShape, unlockShape, duplicateShape, bringForward, sendBack, alignShapes, distributeShapes, groupShapes, ungroupShapes, deleteGroup, undo, redo, canUndo, canRedo } = useCanvasContext();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Track last selected group for two-click selection
  const lastSelectedGroupRef = useRef<{ groupId: string; timestamp: number } | null>(null);
  
  // Box select state
  const [boxSelect, setBoxSelect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const justCompletedBoxSelect = useRef(false);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
  
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
  
  // Group dragging state
  const groupDragRef = useRef<{ groupId: string; initialPositions: Map<string, { x: number; y: number }> } | null>(null);

  // Transformer refs for resize/rotate functionality
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);

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

  // Reset two-click selection when selection changes or is cleared
  useEffect(() => {
    // If selection is cleared or changes, reset the click tracking
    if (selectedIds.length === 0) {
      lastSelectedGroupRef.current = null;
    }
  }, [selectedIds]);

  // Debug: Log groups whenever they change
  useEffect(() => {
    console.log('[Canvas] Groups updated:', groups.length, 'groups:', groups.map(g => ({
      id: g.id,
      shapeCount: g.shapeIds.length,
      shapeIds: g.shapeIds
    })));
    console.log('[Canvas] Shapes with groupId:', shapes.filter(s => s.groupId).map(s => ({
      shapeId: s.id,
      groupId: s.groupId
    })));
  }, [groups, shapes]);

  // Keyboard listener for Space key (panning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        const target = e.target as HTMLElement;
        // Don't handle Space if typing
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Keyboard listener for delete, escape, and other shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't process keyboard shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Escape key: deselect current selection
      if (e.key === 'Escape') {
        if (selectedIds.length > 0) {
          selectShape(null);
          lastSelectedGroupRef.current = null; // Reset two-click selection
        }
        return;
      }

      // Ctrl+D: Duplicate selected shape(s)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedId) {
          duplicateShape(selectedId);
        }
        return;
      }

      // Ctrl+]: Bring forward
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        if (selectedId) {
          bringForward(selectedId);
        }
        return;
      }

      // Ctrl+[: Send back
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        if (selectedId) {
          sendBack(selectedId);
        }
        return;
      }

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }

      // Ctrl+G: Group selected shapes
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length >= 2) {
          groupShapes(selectedIds)
            .then(() => {
              toast.success(`Grouped ${selectedIds.length} shapes`);
            })
            .catch((err) => {
              console.error('Error grouping shapes:', err);
              toast.error('Failed to group shapes');
            });
        } else if (selectedIds.length === 1) {
          toast.error('Select at least 2 shapes to group');
        }
        return;
      }

      // Ctrl+Shift+G: Ungroup selected group
      if ((e.ctrlKey || e.metaKey) && e.key === 'G' && e.shiftKey) {
        e.preventDefault();
        if (selectedIds.length > 0) {
          // Find if any selected shapes belong to groups
          const selectedShapesWithGroups = shapes
            .filter(s => selectedIds.includes(s.id) && s.groupId);
          
          if (selectedShapesWithGroups.length > 0) {
            // Get unique group IDs
            const groupIds = [...new Set(selectedShapesWithGroups.map(s => s.groupId).filter(Boolean))];
            
            // Ungroup all
            Promise.all(groupIds.map(groupId => ungroupShapes(groupId!)))
              .then(() => {
                toast.success(`Ungrouped ${groupIds.length} group(s)`);
              })
              .catch((err) => {
                console.error('Error ungrouping shapes:', err);
                toast.error('Failed to ungroup shapes');
              });
          } else {
            toast.error('Selected shapes are not in a group');
          }
        }
        return;
      }

      // Check if Delete or Backspace key was pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent default browser behavior (e.g., going back in history)
        e.preventDefault();

        // Delete all selected shapes
        if (selectedIds.length > 0) {
          for (const shapeId of selectedIds) {
            const selectedShape = shapes.find((shape) => shape.id === shapeId);
            
            if (selectedShape) {
              // Check if shape is locked by another user (not current user)
              const isLockedByOtherUser = selectedShape.isLocked && 
                                          selectedShape.lockedBy && 
                                          selectedShape.lockedBy !== currentUser?.uid;
              
              if (!isLockedByOtherUser) {
                // Delete the shape
                deleteShape(shapeId);
              } else {
                toast.error(`Cannot delete: Some shapes are locked by other users`);
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedIds, shapes, deleteShape, selectShape, duplicateShape, bringForward, sendBack, undo, redo, canUndo, canRedo, toast, currentUser]);

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
   * Handle shape drag start - enables auto-pan and locks group shapes
   */
  const handleShapeDragStart = useCallback((shapeId: string) => {
    setIsDraggingShape(true);
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !shape.groupId || !currentUser) return;
    
    // Check if dragging a grouped shape
    const group = groups.find(g => g.id === shape.groupId);
    if (!group) return;
    
    // Check if all shapes in the group are selected
    const allSelected = group.shapeIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Save initial positions for all shapes in the group
      const initialPositions = new Map<string, { x: number; y: number }>();
      group.shapeIds.forEach(id => {
        const groupShape = shapes.find(s => s.id === id);
        if (groupShape) {
          initialPositions.set(id, { x: groupShape.x, y: groupShape.y });
        }
      });
      
      groupDragRef.current = {
        groupId: group.id,
        initialPositions
      };
      
      // Lock all shapes in the group
      group.shapeIds.forEach(id => {
        const groupShape = shapes.find(s => s.id === id);
        if (groupShape && (!groupShape.isLocked || groupShape.lockedBy === currentUser.uid)) {
          lockShape(id).catch(err => console.error('Error locking group shape:', err));
        }
      });
    }
  }, [shapes, groups, selectedIds, currentUser, lockShape]);

  /**
   * Handle shape drag end - disables auto-pan and updates position(s)
   */
  const handleShapeDragEnd = useCallback(async (shapeId: string, x: number, y: number) => {
    setIsDraggingShape(false);
    
    const groupDrag = groupDragRef.current;
    
    if (groupDrag) {
      // Dragging a group - calculate delta and move all shapes
      const initialPos = groupDrag.initialPositions.get(shapeId);
      if (initialPos) {
        const deltaX = x - initialPos.x;
        const deltaY = y - initialPos.y;
        
        // Update all shapes in the group
        try {
          await Promise.all(
            Array.from(groupDrag.initialPositions.entries()).map(([id, pos]) => {
              const newX = pos.x + deltaX;
              const newY = pos.y + deltaY;
              return updateShape(id, { x: newX, y: newY });
            })
          );
          
          // Unlock all shapes in the group
          const group = groups.find(g => g.id === groupDrag.groupId);
          if (group) {
            group.shapeIds.forEach(id => {
              unlockShape(id).catch(err => console.error('Error unlocking group shape:', err));
            });
          }
        } catch (error) {
          console.error('Error updating group positions:', error);
          toast.error('Failed to move group');
        }
      }
      
      groupDragRef.current = null;
    } else {
      // Normal single shape drag
      try {
        await updateShape(shapeId, { x, y });
      } catch (error) {
        console.error('Error updating shape position:', error);
      }
    }
  }, [shapes, groups, updateShape, unlockShape, toast]);

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
  /**
   * Handle stage click - deselects shapes when clicking empty area
   * Also handles box select start
   */
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Don't deselect if we just completed a box selection
    if (justCompletedBoxSelect.current) {
      justCompletedBoxSelect.current = false;
      return;
    }
    
    // Check if clicked on empty area (stage itself)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      // Deselect all shapes
      selectShape(null);
      lastSelectedGroupRef.current = null; // Reset two-click selection
    }
  };
  
  /**
   * Handle stage mouse down - start box select
   */
  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const clickedOnEmpty = e.target === stage;
    if (!clickedOnEmpty) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Start panning if Space is pressed
    if (isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        x: pos.x,
        y: pos.y,
        stageX: stage.x(),
        stageY: stage.y(),
      };
      return;
    }
    
    // Start box selection on single-click drag
    if (e.evt.button === 0) {
      const canvasX = (pos.x - stage.x()) / stage.scaleX();
      const canvasY = (pos.y - stage.y()) / stage.scaleY();
      
      setIsBoxSelecting(true);
      setBoxSelect({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
    }
  };
  
  /**
   * Handle stage mouse move - update box select
   */
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Handle panning
    if (isPanning && panStartRef.current) {
      const dx = pos.x - panStartRef.current.x;
      const dy = pos.y - panStartRef.current.y;
      
      const newX = panStartRef.current.stageX + dx;
      const newY = panStartRef.current.stageY + dy;
      
      stage.position({ x: newX, y: newY });
      setStagePos({ x: newX, y: newY });
      return;
    }
    
    // Handle box selection
    if (isBoxSelecting && boxSelect) {
      const canvasX = (pos.x - stage.x()) / stage.scaleX();
      const canvasY = (pos.y - stage.y()) / stage.scaleY();
      setBoxSelect({ ...boxSelect, x2: canvasX, y2: canvasY });
    }
  };
  
  /**
   * Handle stage mouse up - complete box select
   */
  const handleStageMouseUp = () => {
    // End panning
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }
    
    // Handle box selection completion
    if (!isBoxSelecting || !boxSelect) return;
    
    setIsBoxSelecting(false);
    
    // Calculate selection box bounds
    const box = {
      x1: Math.min(boxSelect.x1, boxSelect.x2),
      y1: Math.min(boxSelect.y1, boxSelect.y2),
      x2: Math.max(boxSelect.x1, boxSelect.x2),
      y2: Math.max(boxSelect.y1, boxSelect.y2),
    };
    
    // Find all shapes within the selection box
    const selectedShapeIds = shapes
      .filter(shape => {
        // Check if shape intersects with selection box
        const shapeRight = shape.x + (shape.width || 0);
        const shapeBottom = shape.y + (shape.height || 0);
        
        return shape.x <= box.x2 && 
               shapeRight >= box.x1 && 
               shape.y <= box.y2 && 
               shapeBottom >= box.y1;
      })
      .map(shape => shape.id);
    
    // Select all shapes in the box at once
    if (selectedShapeIds.length > 0) {
      selectMultipleShapes(selectedShapeIds);
      justCompletedBoxSelect.current = true;
    }
    
    setBoxSelect(null);
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
  const renderShapeByType = (shape: ShapeType, shapeIsSelected: boolean) => {
    const commonProps = {
      id: shape.id,
      isSelected: shapeIsSelected,
      isLocked: shape.isLocked,
      lockedBy: shape.lockedBy,
      currentUserId: currentUser?.uid || null,
      onSelect: (e?: any) => {
        const shiftKey = e?.evt?.shiftKey || false;
        
        console.log('[Canvas] Shape clicked:', shape.id, 'groupId:', shape.groupId, 'groups available:', groups.length);
        
        // Two-click selection for grouped shapes
        if (shape.groupId && !shiftKey) {
          const now = Date.now();
          const lastSelectedGroup = lastSelectedGroupRef.current;
          
          console.log('[Canvas] Last selected group:', lastSelectedGroup, 'current time:', now);
          
          // Check if we just selected this group (any shape in it) within 500ms
          if (lastSelectedGroup && lastSelectedGroup.groupId === shape.groupId && (now - lastSelectedGroup.timestamp) < 500) {
            // Second click on the group: select just this individual shape
            console.log('[Canvas] Second click on group detected - selecting individual shape:', shape.id);
            selectShape(shape.id, { shift: false });
            lastSelectedGroupRef.current = null; // Reset
          } else {
            // First click on the group: select the entire group
            console.log('[Canvas] First click on group - looking for group:', shape.groupId);
            const group = groups.find(g => g.id === shape.groupId);
            if (group) {
              console.log('[Canvas] ✓ Selecting group:', group.id, 'with', group.shapeIds.length, 'shapes');
              selectMultipleShapes(group.shapeIds);
              lastSelectedGroupRef.current = { groupId: shape.groupId, timestamp: now };
            } else {
              // Group not found, select just the shape
              console.warn('[Canvas] ✗ Group not found for shape:', shape.id, 'groupId:', shape.groupId, 'available groups:', groups.map(g => g.id));
              selectShape(shape.id, { shift: false });
            }
          }
        } else {
          // Not in a group or shift-click: normal selection
          console.log('[Canvas] Not in group or shift-click - normal selection');
          selectShape(shape.id, { shift: shiftKey });
          lastSelectedGroupRef.current = null; // Reset
        }
      },
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
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

  /**
   * Effect to attach Transformer to selected shape
   * Finds the shape node by ID and attaches the Transformer to it
   */
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedId && selectedShape) {
      // Don't show transformer for lines (they use custom endpoint handles)
      if (selectedShape.type === 'line') {
        transformer.nodes([]);
        return;
      }

      // Don't show transformer if shape is locked by another user
      const isLockedByOtherUser = selectedShape.isLocked && 
                                   selectedShape.lockedBy && 
                                   selectedShape.lockedBy !== currentUser?.uid;
      if (isLockedByOtherUser) {
        transformer.nodes([]);
        return;
      }

      // Find the shape node in the layer
      const stage = stageRef?.current;
      if (!stage) return;

      const layer = stage.findOne('Layer');
      if (!layer) return;

      const node = layer.findOne(`#${selectedId}`);
      if (node) {
        selectedShapeRef.current = node;
        transformer.nodes([node]);
        
        // Configure transformer based on shape type
        if (selectedShape.type === 'circle') {
          // Circle: maintain aspect ratio (uniform scaling)
          transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
          transformer.keepRatio(true);
        } else {
          // Rectangle and Text: allow free resizing
          transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
          transformer.keepRatio(false);
        }
        
        transformer.getLayer()?.batchDraw();
      }
    } else {
      // No selection - clear transformer
      transformer.nodes([]);
      selectedShapeRef.current = null;
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, selectedShape, currentUser?.uid, stageRef]);

  /**
   * Handle transform end - save rotation and scale to Firestore
   * Calculates and normalizes rotation, applies scale to width/height
   */
  const handleTransformEnd = useCallback(async () => {
    const node = selectedShapeRef.current;
    if (!node || !selectedId) return;

    // Get transform values
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Normalize rotation to 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360;

    // Calculate new dimensions based on scale
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;

    // Check if shape is locked by another user
    const isLockedByOtherUser = shape.isLocked && 
                                 shape.lockedBy && 
                                 shape.lockedBy !== currentUser?.uid;
    if (isLockedByOtherUser) {
      toast.error('Cannot transform: This shape is locked by another user');
      return;
    }

    try {
      const updates: Partial<ShapeType> = {
        rotation: normalizedRotation,
        scaleX,
        scaleY,
      };

      // For circles, update radius based on scale
      if (shape.type === 'circle' && shape.radius) {
        updates.radius = shape.radius * scaleX;
        // Reset scale after applying to radius
        updates.scaleX = 1;
        updates.scaleY = 1;
        node.scaleX(1);
        node.scaleY(1);
      }

      // For rectangles and text, update width/height
      if (shape.type === 'rectangle' || shape.type === 'text') {
        updates.width = shape.width * scaleX;
        updates.height = shape.height * scaleY;
        // Reset scale after applying to dimensions
        updates.scaleX = 1;
        updates.scaleY = 1;
        node.scaleX(1);
        node.scaleY(1);
      }

      // Check boundary constraints
      const nodeBox = node.getClientRect();
      const x = node.x();
      const y = node.y();
      
      // Simple boundary check - ensure shape center is within canvas
      let constrainedX = x;
      let constrainedY = y;
      
      if (nodeBox.x < 0) constrainedX = x - nodeBox.x;
      if (nodeBox.y < 0) constrainedY = y - nodeBox.y;
      if (nodeBox.x + nodeBox.width > CANVAS_WIDTH) constrainedX = x - (nodeBox.x + nodeBox.width - CANVAS_WIDTH);
      if (nodeBox.y + nodeBox.height > CANVAS_HEIGHT) constrainedY = y - (nodeBox.y + nodeBox.height - CANVAS_HEIGHT);
      
      if (constrainedX !== x || constrainedY !== y) {
        updates.x = constrainedX;
        updates.y = constrainedY;
        node.position({ x: constrainedX, y: constrainedY });
      }

      await updateShape(selectedId, updates);
    } catch (error) {
      console.error('Error saving transformation:', error);
      toast.error('Failed to save transformation');
    }
  }, [selectedId, shapes, currentUser?.uid, updateShape, toast]);

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

  // Sort shapes by zIndex (higher = on top)
  const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  return (
    <div 
      className="w-full h-full bg-gray-100 overflow-hidden relative"
      style={{ cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        draggable={false}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleStageMouseMove(e);
        }}
        onMouseUp={handleStageMouseUp}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
      >
        <Layer>
          {/* Background grid or color can be added here */}
          {/* Render all shapes sorted by zIndex */}
          {sortedShapes.map((shape) => renderShapeByType(shape, isSelected(shape.id)))}
          
          {/* Render group outlines (dotted rectangles around groups) */}
          {groups.map((group) => {
            // Check if any shape in the group is selected
            const hasSelectedShape = group.shapeIds.some(id => isSelected(id));
            if (!hasSelectedShape) return null;
            
            return (
              <Rect
                key={`group-outline-${group.id}`}
                x={group.x}
                y={group.y}
                width={group.width}
                height={group.height}
                stroke="rgb(99, 102, 241)" // Indigo color
                strokeWidth={2 / stageScale}
                dash={[8 / stageScale, 4 / stageScale]}
                listening={false}
                perfectDrawEnabled={false}
              />
            );
          })}
          
          {/* Transformer for resize and rotate */}
          <Transformer
            ref={transformerRef}
            onTransform={() => {
              // For text shapes, prevent font scaling by keeping scale at 1 and adjusting width/height instead
              const node = selectedShapeRef.current;
              if (node && selectedShape && selectedShape.type === 'text') {
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                
                // Apply scale to width/height
                node.setAttrs({
                  width: Math.max(20, node.width() * scaleX),
                  height: Math.max(20, node.height() * scaleY),
                  scaleX: 1,
                  scaleY: 1,
                });
              }
            }}
            onTransformEnd={handleTransformEnd}
            boundBoxFunc={(oldBox, newBox) => {
              // Prevent transformer from making shapes too small
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
          />
          
          {/* Box select visualization */}
          {boxSelect && (
            <Rect
              x={Math.min(boxSelect.x1, boxSelect.x2)}
              y={Math.min(boxSelect.y1, boxSelect.y2)}
              width={Math.abs(boxSelect.x2 - boxSelect.x1)}
              height={Math.abs(boxSelect.y2 - boxSelect.y1)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2 / stageScale}
              dash={[10 / stageScale, 5 / stageScale]}
              listening={false}
            />
          )}
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

      {/* Alignment Tools (shows when multiple shapes selected) */}
      <AlignmentTools
        selectedCount={selectedIds.length}
        onAlign={alignShapes}
        onDistribute={distributeShapes}
        onGroup={() => {
          if (selectedIds.length >= 2) {
            groupShapes(selectedIds)
              .then(() => toast.success(`Grouped ${selectedIds.length} shapes`))
              .catch(err => {
                console.error('Error grouping shapes:', err);
                toast.error('Failed to group shapes');
              });
          }
        }}
        onUngroup={() => {
          // Find groups of selected shapes
          const selectedShapesWithGroups = shapes.filter(s => selectedIds.includes(s.id) && s.groupId);
          const groupIds = [...new Set(selectedShapesWithGroups.map(s => s.groupId).filter(Boolean))];
          
          if (groupIds.length > 0) {
            Promise.all(groupIds.map(groupId => ungroupShapes(groupId!)))
              .then(() => toast.success(`Ungrouped ${groupIds.length} group(s)`))
              .catch(err => {
                console.error('Error ungrouping shapes:', err);
                toast.error('Failed to ungroup shapes');
              });
          }
        }}
        hasGroupedShapes={shapes.some(s => selectedIds.includes(s.id) && s.groupId)}
      />

      {/* Canvas Controls */}
      <CanvasControls
        zoom={stageScale}
        minZoom={MIN_ZOOM}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onAddShape={handleAddShape}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
};

export default Canvas;

