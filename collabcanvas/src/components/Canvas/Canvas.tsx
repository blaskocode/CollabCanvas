import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Transformer, Rect, Circle as KonvaCircle, Line as KonvaLine } from 'react-konva';
import type Konva from 'konva';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAuth } from '../../hooks/useAuth';
import { useCursors } from '../../hooks/useCursors';
import { useToast } from '../../hooks/useToast';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, AUTO_PAN_EDGE_THRESHOLD, AUTO_PAN_SPEED_MAX, AUTO_PAN_SPEED_MIN, GLOBAL_CANVAS_ID } from '../../utils/constants';
import CanvasControls from './CanvasControls';
import ComponentLibrary from './ComponentLibrary';
import CommentsPanel from './CommentsPanel';
import PropertyPanel from './PropertyPanel';
import AlignmentTools from './AlignmentTools';
import AIInput from './AIInput';
import ContextMenu from './ContextMenu';
import Shape from './Shape';
import Rectangle from './shapes/Rectangle';
import Circle from './shapes/Circle';
import Text from './shapes/Text';
import Line from './shapes/Line';
import ProcessBox from './shapes/ProcessBox';
import DecisionDiamond from './shapes/DecisionDiamond';
import StartEndOval from './shapes/StartEndOval';
import DocumentShape from './shapes/DocumentShape';
import DatabaseShape from './shapes/DatabaseShape';
import Connector from './shapes/Connector';
import Triangle from './shapes/Triangle';
import RightTriangle from './shapes/RightTriangle';
import Hexagon from './shapes/Hexagon';
import Octagon from './shapes/Octagon';
import Ellipse from './shapes/Ellipse';
import TextInput from './shapes/TextInput';
import Textarea from './shapes/Textarea';
import Dropdown from './shapes/Dropdown';
import Radio from './shapes/Radio';
import Checkbox from './shapes/Checkbox';
import Button from './shapes/Button';
import Toggle from './shapes/Toggle';
import Slider from './shapes/Slider';
import { ShapeAnchors } from './AnchorPoint';
import InlineTextEditor from './InlineTextEditor';
import Cursor from '../Collaboration/Cursor';
import GridOverlay from './GridOverlay';
import SmartGuides from './SmartGuides';
import CommentBadge from './CommentBadge';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Shape as ShapeType, Connection } from '../../utils/types';
import { supportsAnchors } from '../../utils/anchor-snapping';
import { snapToGrid, findAlignmentGuides, type AlignmentGuide } from '../../utils/snapping';

/**
 * Canvas Component
 * Main canvas component with Konva Stage and Layer
 * Handles pan, zoom, and shape rendering
 */
const Canvas: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { shapes, groups, connections, selectedId, selectedIds, selectedConnectionId, isSelected, loading, stageRef, selectShape, selectMultipleShapes, addShape, updateShape, deleteShape, deleteMultipleShapes, lockShape, unlockShape, duplicateShape, bringForward, sendBack, alignShapes, distributeShapes, groupShapes, ungroupShapes, moveShapesByArrowKey, saveArrowKeyMovementToHistory, addConnection, updateConnection, deleteConnection, selectConnection, undo, redo, canUndo, canRedo, clearAll, copyShapes, cutShapes, pasteShapes, hasClipboardData, exportCanvas, gridEnabled, toggleGrid, selectShapesInLasso, selectShapesByType, getShapeCommentCount, getShapeUnresolvedCommentCount } = useCanvasContext();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  // Inline text editor state
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  
  // Track when editing just finished to prevent immediate drag
  const [justFinishedEditingId, setJustFinishedEditingId] = useState<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track last selected group for two-click selection
  const lastSelectedGroupRef = useRef<{ groupId: string; timestamp: number } | null>(null);
  
  // Selection mode: 'box' or 'lasso'
  const [selectionMode, setSelectionMode] = useState<'box' | 'lasso'>('box');
  
  // Component library state
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  
  // Comments panel state
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  
  // Track which panel is on top (for z-index management)
  const [topPanel, setTopPanel] = useState<'components' | 'comments' | null>(null);
  
  // Box select state
  const [boxSelect, setBoxSelect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const justCompletedBoxSelect = useRef(false);
  
  // Lasso select state
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);
  const [lassoPath, setLassoPath] = useState<Array<{ x: number; y: number }>>([]);
  const justCompletedLassoSelect = useRef(false);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
  const isDraggingShapeRef = useRef(false); // Track shape drag to prevent pan conflicts
  
  // Arrow key movement state (for batched history)
  const arrowKeyCumulativeDeltaRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const arrowKeyShapeIdsRef = useRef<string[]>([]);
  const arrowKeyOriginalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
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
  const groupDragRef = useRef<{ groupId: string; initialPositions: Map<string, { x: number; y: number }>; draggedShapeId: string } | null>(null);
  
  // Multi-select dragging state (for non-grouped shapes)
  const multiSelectDragRef = useRef<{ initialPositions: Map<string, { x: number; y: number }>; draggedShapeId: string } | null>(null);
  
  // Store Konva node references for real-time drag updates
  const shapeNodesRef = useRef<Map<string, any>>(new Map());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null);

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingShapeType, setDrawingShapeType] = useState<ShapeType['type'] | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const drawingStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Placement mode state (click-to-place for workflow shapes)
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [placementShapeType, setPlacementShapeType] = useState<ShapeType['type'] | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{ x: number; y: number } | null>(null);
  
  // Hover state for showing anchors
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  
  // Connection mode state (click anchor to anchor)
  const [connectionStart, setConnectionStart] = useState<{ shapeId: string; anchor: string } | null>(null);

  // Smart guides state for alignment during drag
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Transformer refs for resize/rotate functionality
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);
  
  // Default sizes for workflow shapes and form elements (width x height)
  const defaultWorkflowShapeSizes: Record<string, { width: number; height: number }> = {
    // Workflow shapes
    process: { width: 160, height: 80 },
    decision: { width: 120, height: 120 },
    startEnd: { width: 140, height: 70 },
    document: { width: 140, height: 100 },
    database: { width: 120, height: 80 },
    // Form elements (fixed sizes, click to place)
    button: { width: 120, height: 40 },
    textInput: { width: 200, height: 36 },
    textarea: { width: 200, height: 100 },
    dropdown: { width: 200, height: 36 },
    checkbox: { width: 20, height: 20 },
    radio: { width: 20, height: 20 },
    toggle: { width: 48, height: 24 },
    slider: { width: 200, height: 24 },
  };

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
  
  // Cleanup editing timeout on unmount
  useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle arrow key movement with batched history
   * Moves shapes 1px at a time and batches multiple movements into a single undo entry
   * History is only saved when the arrow key is released (via handleArrowKeyRelease)
   */
  const handleArrowKeyMove = useCallback((shapeIds: string[], dx: number, dy: number) => {
    // Store original positions on first move (when refs are empty)
    if (arrowKeyShapeIdsRef.current.length === 0) {
      arrowKeyOriginalPositionsRef.current.clear();
      shapeIds.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          arrowKeyOriginalPositionsRef.current.set(id, { x: shape.x, y: shape.y });
        }
      });
      arrowKeyShapeIdsRef.current = shapeIds;
    }
    
    // Accumulate deltas
    arrowKeyCumulativeDeltaRef.current.dx += dx;
    arrowKeyCumulativeDeltaRef.current.dy += dy;
    
    // Move shapes immediately (optimistic)
    moveShapesByArrowKey(shapeIds, dx, dy);
  }, [shapes, moveShapesByArrowKey]);

  /**
   * Handle arrow key release - save to history immediately
   * This ensures all movements since the key was first pressed are batched into a single undo entry
   */
  const handleArrowKeyRelease = useCallback(() => {
    // Only save if there was actual movement
    const totalDx = arrowKeyCumulativeDeltaRef.current.dx;
    const totalDy = arrowKeyCumulativeDeltaRef.current.dy;
    const movedShapeIds = arrowKeyShapeIdsRef.current;
    const originalPositions = new Map(arrowKeyOriginalPositionsRef.current);
    
    if (movedShapeIds.length > 0 && (totalDx !== 0 || totalDy !== 0)) {
      saveArrowKeyMovementToHistory(movedShapeIds, totalDx, totalDy, originalPositions);
    }
    
    // Reset state for next movement
    arrowKeyCumulativeDeltaRef.current = { dx: 0, dy: 0 };
    arrowKeyShapeIdsRef.current = [];
    arrowKeyOriginalPositionsRef.current.clear();
  }, [saveArrowKeyMovementToHistory]);

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

      // Arrow key movement (1px precision)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        // Determine which shapes to move
        const shapeIdsToMove: string[] = [];
        if (selectedId) shapeIdsToMove.push(selectedId);
        if (selectedIds.length > 0) shapeIdsToMove.push(...selectedIds);
        
        // No shapes selected, do nothing
        if (shapeIdsToMove.length === 0) return;
        
        // Calculate movement delta
        const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        
        handleArrowKeyMove(shapeIdsToMove, dx, dy);
        return;
      }

      // Escape key: exit drawing/placement mode or deselect current selection
      if (e.key === 'Escape') {
        if (isDrawingMode) {
          exitDrawingMode();
        } else if (isPlacementMode) {
          exitPlacementMode();
        } else if (isLassoDrawing) {
          // Cancel active lasso
          setIsLassoDrawing(false);
          setLassoPath([]);
        } else if (selectedIds.length > 0) {
          selectShape(null);
          lastSelectedGroupRef.current = null; // Reset two-click selection
        }
        return;
      }

      // Ctrl+C: Copy selected shape(s)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          copyShapes(selectedIds);
          toast.success(`Copied ${selectedIds.length} shape${selectedIds.length > 1 ? 's' : ''}`);
        }
        return;
      }

      // Ctrl+X: Cut selected shape(s)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          const count = selectedIds.length;
          cutShapes(selectedIds).then(() => {
            toast.success(`Cut ${count} shape${count > 1 ? 's' : ''}`);
          }).catch(err => {
            console.error('Cut error:', err);
            toast.error('Failed to cut shapes');
          });
        }
        return;
      }

      // Ctrl+V: Paste from clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (hasClipboardData) {
          pasteShapes().then(() => {
            toast.success('Pasted shapes');
          }).catch(err => {
            console.error('Paste error:', err);
            toast.error('Failed to paste shapes');
          });
        }
        return;
      }

      // Ctrl+D: Duplicate selected shape(s)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedIds.length > 0) {
          // Capture the shape IDs before any state changes
          const shapesToDuplicate = [...selectedIds];
          let duplicatedCount = 0;
          let lockedCount = 0;
          
          // Check which shapes can be duplicated
          const duplicateOperations = shapesToDuplicate.map(shapeId => {
            const selectedShape = shapes.find((shape) => shape.id === shapeId);
            
            if (selectedShape) {
              // Check if shape is locked by another user
              const isLockedByOtherUser = selectedShape.isLocked && 
                                          selectedShape.lockedBy && 
                                          selectedShape.lockedBy !== currentUser?.uid;
              
              if (!isLockedByOtherUser) {
                return { shapeId, canDuplicate: true };
              } else {
                return { shapeId, canDuplicate: false };
              }
            }
            return { shapeId, canDuplicate: false };
          });
          
          // Count operations
          duplicatedCount = duplicateOperations.filter(op => op.canDuplicate).length;
          lockedCount = duplicateOperations.filter(op => !op.canDuplicate).length;
          
          // Execute duplications sequentially to avoid race conditions
          const executeDuplicates = async () => {
            for (const op of duplicateOperations.filter(op => op.canDuplicate)) {
              await duplicateShape(op.shapeId);
            }
          };
          
          executeDuplicates()
            .then(() => {
              if (duplicatedCount > 0) {
                if (duplicatedCount > 1) {
                  toast.success(`Duplicated ${duplicatedCount} shapes`);
                } else {
                  toast.success('Shape duplicated');
                }
              }
              if (lockedCount > 0) {
                toast.error(`Cannot duplicate: ${lockedCount} shape${lockedCount > 1 ? 's are' : ' is'} locked by other users`);
              }
            })
            .catch((err) => {
              console.error('Error duplicating shapes:', err);
              toast.error('Failed to duplicate some shapes');
            });
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

      // Ctrl+': Toggle grid
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        toggleGrid();
        toast.success(gridEnabled ? 'Grid hidden' : 'Grid shown');
        return;
      }

      // L: Toggle between box and lasso selection modes
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setSelectionMode(prev => prev === 'box' ? 'lasso' : 'box');
        toast.success(selectionMode === 'box' ? 'Lasso selection mode' : 'Box selection mode');
        return;
      }

      // C: Toggle component library (mutually exclusive with comments)
      if (e.key === 'c' || e.key === 'C') {
        // Don't trigger if we're in a text input or if Ctrl/Cmd is pressed (for copy)
        if ((e.target as HTMLElement).tagName === 'INPUT' || 
            (e.target as HTMLElement).tagName === 'TEXTAREA' ||
            e.ctrlKey || e.metaKey) {
          return;
        }
        e.preventDefault();
        
        // If component library is already open, close it
        if (showComponentLibrary) {
          setShowComponentLibrary(false);
          setTopPanel(null);
          toast.success('Component library hidden');
        } else {
          // Open component library and close comments if open
          setShowComponentLibrary(true);
          if (showCommentsPanel) {
            setShowCommentsPanel(false);
          }
          setTopPanel('components');
          toast.success('Component library shown');
        }
        return;
      }

      // M: Toggle comments panel (mutually exclusive with components)
      if (e.key === 'm' || e.key === 'M') {
        // Don't trigger if we're in a text input or if Ctrl/Cmd is pressed
        if ((e.target as HTMLElement).tagName === 'INPUT' || 
            (e.target as HTMLElement).tagName === 'TEXTAREA' ||
            e.ctrlKey || e.metaKey) {
          return;
        }
        e.preventDefault();
        
        // If comments panel is already open, close it
        if (showCommentsPanel) {
          setShowCommentsPanel(false);
          setTopPanel(null);
          toast.success('Comments panel hidden');
        } else {
          // Open comments panel and close components if open
          setShowCommentsPanel(true);
          if (showComponentLibrary) {
            setShowComponentLibrary(false);
          }
          setTopPanel('comments');
          toast.success('Comments panel shown');
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

        // Delete selected connection first (if any)
        if (selectedConnectionId) {
          deleteConnection(selectedConnectionId)
            .then(() => {
              toast.success('Connection deleted');
            })
            .catch((error) => {
              console.error('Error deleting connection:', error);
              toast.error('Failed to delete connection');
            });
          return;
        }

        // Delete all selected shapes
        if (selectedIds.length > 0) {
          // Capture the shape IDs before any state changes
          const shapesToDelete = [...selectedIds];
          
          // Check which shapes can be deleted (not locked by other users)
          const idsToDelete: string[] = [];
          let lockedCount = 0;
          
          shapesToDelete.forEach(shapeId => {
            const selectedShape = shapes.find((shape) => shape.id === shapeId);
            
            if (selectedShape) {
              // Check if shape is locked by another user (not current user)
              const isLockedByOtherUser = selectedShape.isLocked && 
                                          selectedShape.lockedBy && 
                                          selectedShape.lockedBy !== currentUser?.uid;
              
              if (!isLockedByOtherUser) {
                idsToDelete.push(shapeId);
              } else {
                lockedCount++;
              }
            }
          });
          
          // Clear selection immediately for instant visual feedback
          selectShape(null);
          
          // Delete all shapes in a single atomic Firestore operation
          if (idsToDelete.length > 0) {
            deleteMultipleShapes(idsToDelete)
              .then(() => {
                if (idsToDelete.length > 1) {
                  toast.success(`Deleted ${idsToDelete.length} shapes`);
                } else {
                  toast.success('Shape deleted');
                }
                if (lockedCount > 0) {
                  toast.error(`Cannot delete: ${lockedCount} shape${lockedCount > 1 ? 's are' : ' is'} locked by other users`);
                }
              })
              .catch((err) => {
                console.error('Error deleting shapes:', err);
                toast.error('Failed to delete some shapes');
              });
          } else if (lockedCount > 0) {
            toast.error(`Cannot delete: All selected shapes are locked by other users`);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't process if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Arrow key released - save to history
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleArrowKeyRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, selectedIds, shapes, selectedConnectionId, deleteShape, deleteConnection, selectShape, duplicateShape, bringForward, sendBack, groupShapes, ungroupShapes, undo, redo, canUndo, canRedo, toast, currentUser, toggleGrid, gridEnabled, copyShapes, cutShapes, pasteShapes, hasClipboardData, selectionMode, showComponentLibrary, showCommentsPanel, handleArrowKeyRelease]);

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
   * Handle shape drag start - enables auto-pan and locks group/multi-select shapes
   */
  const handleShapeDragStart = useCallback((shapeId: string) => {
    setIsDraggingShape(true);
    isDraggingShapeRef.current = true; // Prevent pan conflicts
    
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape || !currentUser) return;
    
    // Check if dragging a grouped shape
    if (shape.groupId) {
      const group = groups.find(g => g.id === shape.groupId);
      if (!group) return;
      
      // Check how many shapes in this group are currently selected
      const selectedGroupShapes = selectedIds.filter(id => {
        const s = shapes.find(sh => sh.id === id);
        return s && s.groupId === shape.groupId;
      });
      
      // If only this one shape is selected (double-clicked for individual edit), keep it that way
      if (selectedGroupShapes.length === 1 && selectedGroupShapes[0] === shapeId) {
        // This will fall through to normal single shape drag
      } else {
        // Otherwise, this is a group drag operation
        // Select all shapes in the group if not already selected
        const allSelected = group.shapeIds.every(id => selectedIds.includes(id));
        if (!allSelected) {
          selectMultipleShapes(group.shapeIds);
        }
        
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
          initialPositions,
          draggedShapeId: shapeId // Track which shape is being dragged
        };
        
        // Lock all shapes in the group
        group.shapeIds.forEach(id => {
          const groupShape = shapes.find(s => s.id === id);
          if (groupShape && (!groupShape.isLocked || groupShape.lockedBy === currentUser.uid)) {
            lockShape(id).catch(err => console.error('Error locking group shape:', err));
          }
        });
        return; // Exit early, group drag is set up
      }
    }
    
    // If we get here, it's not a group drag (either single shape or individual shape from group)
    // Select the shape immediately if it's not already selected
    if (!selectedIds.includes(shapeId)) {
      selectShape(shapeId);
    }
    
    // Check if dragging a multi-selected (non-grouped) shape
    if (selectedIds.length > 1 && selectedIds.includes(shapeId) && !shape.groupId) {
      // Save initial positions for all selected NON-GROUPED shapes
      const initialPositions = new Map<string, { x: number; y: number }>();
      selectedIds.forEach(id => {
        const selectedShape = shapes.find(s => s.id === id);
        // Only include non-grouped shapes in multi-select drag
        if (selectedShape && !selectedShape.groupId) {
          initialPositions.set(id, { x: selectedShape.x, y: selectedShape.y });
        }
      });
      
      // Only set multi-select drag if we have shapes to drag
      if (initialPositions.size > 1) { // Need at least 2 shapes for multi-drag
        multiSelectDragRef.current = {
          initialPositions,
          draggedShapeId: shapeId // Track which shape is being dragged
        };
        
        // Lock all selected non-grouped shapes
        Array.from(initialPositions.keys()).forEach(id => {
          const selectedShape = shapes.find(s => s.id === id);
          if (selectedShape && (!selectedShape.isLocked || selectedShape.lockedBy === currentUser.uid)) {
            lockShape(id).catch(err => console.error('Error locking selected shape:', err));
          }
        });
      }
    }
  }, [shapes, groups, selectedIds, currentUser, lockShape, selectShape, selectMultipleShapes]);

  /**
   * Handle shape drag move - updates other shapes' visual positions in real-time
   * This provides immediate visual feedback during group and multi-select drags
   * Also enforces boundary constraints so no shape goes outside the canvas
   */
  const handleShapeDragMove = useCallback((shapeId: string, x: number, y: number) => {
    const groupDrag = groupDragRef.current;
    const multiSelectDrag = multiSelectDragRef.current;
    
    // Group drag - move all shapes in the group together
    if (groupDrag && groupDrag.draggedShapeId === shapeId) {
      const initialPos = groupDrag.initialPositions.get(shapeId);
      if (!initialPos) return;
      
      let deltaX = x - initialPos.x;
      let deltaY = y - initialPos.y;
      
      // Calculate bounds of all shapes to enforce canvas boundaries
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      groupDrag.initialPositions.forEach((pos, id) => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          const newX = pos.x + deltaX;
          const newY = pos.y + deltaY;
          
          // Calculate bounds based on shape type
          if (shape.type === 'circle' && shape.radius) {
            minX = Math.min(minX, newX - shape.radius);
            maxX = Math.max(maxX, newX + shape.radius);
            minY = Math.min(minY, newY - shape.radius);
            maxY = Math.max(maxY, newY + shape.radius);
          } else if (shape.type === 'line' && shape.points) {
            const [x1, y1, x2, y2] = shape.points;
            minX = Math.min(minX, newX + Math.min(x1, x2));
            maxX = Math.max(maxX, newX + Math.max(x1, x2));
            minY = Math.min(minY, newY + Math.min(y1, y2));
            maxY = Math.max(maxY, newY + Math.max(y1, y2));
          } else {
            minX = Math.min(minX, newX);
            maxX = Math.max(maxX, newX + (shape.width || 0));
            minY = Math.min(minY, newY);
            maxY = Math.max(maxY, newY + (shape.height || 0));
          }
        }
      });
      
      // Constrain delta to keep all shapes within canvas
      if (minX < 0) deltaX -= minX;
      if (minY < 0) deltaY -= minY;
      if (maxX > CANVAS_WIDTH) deltaX -= (maxX - CANVAS_WIDTH);
      if (maxY > CANVAS_HEIGHT) deltaY -= (maxY - CANVAS_HEIGHT);
      
      // Update the dragged shape node first
      const draggedNode = shapeNodesRef.current.get(shapeId);
      if (draggedNode) {
        draggedNode.position({
          x: initialPos.x + deltaX,
          y: initialPos.y + deltaY
        });
      }
      
      // Update all other shapes in the group
      groupDrag.initialPositions.forEach((pos, id) => {
        if (id !== shapeId) {
          const node = shapeNodesRef.current.get(id);
          if (node) {
            node.position({
              x: pos.x + deltaX,
              y: pos.y + deltaY
            });
          }
        }
      });
      
      // Update the layer to reflect changes
      const stage = stageRef?.current;
      if (stage) {
        const layer = stage.findOne('Layer');
        layer?.batchDraw();
      }
    }
    // Multi-select drag - move all selected shapes together
    else if (multiSelectDrag && multiSelectDrag.draggedShapeId === shapeId) {
      const initialPos = multiSelectDrag.initialPositions.get(shapeId);
      if (!initialPos) return;
      
      let deltaX = x - initialPos.x;
      let deltaY = y - initialPos.y;
      
      // Calculate bounds of all shapes to enforce canvas boundaries
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      multiSelectDrag.initialPositions.forEach((pos, id) => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          const newX = pos.x + deltaX;
          const newY = pos.y + deltaY;
          
          // Calculate bounds based on shape type
          if (shape.type === 'circle' && shape.radius) {
            minX = Math.min(minX, newX - shape.radius);
            maxX = Math.max(maxX, newX + shape.radius);
            minY = Math.min(minY, newY - shape.radius);
            maxY = Math.max(maxY, newY + shape.radius);
          } else if (shape.type === 'line' && shape.points) {
            const [x1, y1, x2, y2] = shape.points;
            minX = Math.min(minX, newX + Math.min(x1, x2));
            maxX = Math.max(maxX, newX + Math.max(x1, x2));
            minY = Math.min(minY, newY + Math.min(y1, y2));
            maxY = Math.max(maxY, newY + Math.max(y1, y2));
          } else {
            minX = Math.min(minX, newX);
            maxX = Math.max(maxX, newX + (shape.width || 0));
            minY = Math.min(minY, newY);
            maxY = Math.max(maxY, newY + (shape.height || 0));
          }
        }
      });
      
      // Constrain delta to keep all shapes within canvas
      if (minX < 0) deltaX -= minX;
      if (minY < 0) deltaY -= minY;
      if (maxX > CANVAS_WIDTH) deltaX -= (maxX - CANVAS_WIDTH);
      if (maxY > CANVAS_HEIGHT) deltaY -= (maxY - CANVAS_HEIGHT);
      
      // Update the dragged shape node first
      const draggedNode = shapeNodesRef.current.get(shapeId);
      if (draggedNode) {
        draggedNode.position({
          x: initialPos.x + deltaX,
          y: initialPos.y + deltaY
        });
      }
      
      // Update all other selected shapes
      multiSelectDrag.initialPositions.forEach((pos, id) => {
        if (id !== shapeId) {
          const node = shapeNodesRef.current.get(id);
          if (node) {
            node.position({
              x: pos.x + deltaX,
              y: pos.y + deltaY
            });
          }
        }
      });
      
      // Update the layer to reflect changes
      const stage = stageRef?.current;
      if (stage) {
        const layer = stage.findOne('Layer');
        layer?.batchDraw();
      }
    }
    // Single shape drag - apply snapping and show smart guides
    else {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) return;
      
      let snappedX = x;
      let snappedY = y;
      
      // Apply grid snapping if enabled
      if (gridEnabled) {
        const snapped = snapToGrid(x, y);
        snappedX = snapped.x;
        snappedY = snapped.y;
      }
      
      // Find alignment guides with other shapes
      const tempShape = { ...shape, x: snappedX, y: snappedY };
      const otherShapes = shapes.filter(s => s.id !== shapeId && !selectedIds.includes(s.id));
      const guides = findAlignmentGuides(tempShape as any, otherShapes);
      
      // Apply guide snapping - guides are already filtered by threshold in findAlignmentGuides
      if (guides.length > 0) {
        guides.forEach(guide => {
          if (guide.type === 'vertical') {
            // Snap X position to guide based on alignment type
            if (guide.alignmentType === 'centerX') {
              // Center alignment
              if (shape.type === 'circle') {
                // For circles, x is already the center
                snappedX = guide.position;
              } else {
                // For rectangles, adjust to center
                snappedX = guide.position - ((shape.width || 0) / 2);
              }
            } else if (guide.alignmentType === 'left') {
              // Left edge alignment
              if (shape.type === 'circle' && shape.radius) {
                snappedX = guide.position + shape.radius;
              } else {
                snappedX = guide.position;
              }
            } else if (guide.alignmentType === 'right') {
              // Right edge alignment
              if (shape.type === 'circle' && shape.radius) {
                snappedX = guide.position - shape.radius;
              } else {
                snappedX = guide.position - (shape.width || 0);
              }
            }
          } else if (guide.type === 'horizontal') {
            // Snap Y position to guide based on alignment type
            if (guide.alignmentType === 'centerY') {
              // Center alignment
              if (shape.type === 'circle') {
                // For circles, y is already the center
                snappedY = guide.position;
              } else {
                // For rectangles, adjust to center
                snappedY = guide.position - ((shape.height || 0) / 2);
              }
            } else if (guide.alignmentType === 'top') {
              // Top edge alignment
              if (shape.type === 'circle' && shape.radius) {
                snappedY = guide.position + shape.radius;
              } else {
                snappedY = guide.position;
              }
            } else if (guide.alignmentType === 'bottom') {
              // Bottom edge alignment
              if (shape.type === 'circle' && shape.radius) {
                snappedY = guide.position - shape.radius;
              } else {
                snappedY = guide.position - (shape.height || 0);
              }
            }
          }
        });
        
        // Update alignment guides state
        setAlignmentGuides(guides);
      } else {
        // Clear alignment guides if no guides found
        setAlignmentGuides([]);
      }
      
      // Enforce canvas boundaries
      if (shape.type === 'circle' && shape.radius) {
        snappedX = Math.max(shape.radius, Math.min(CANVAS_WIDTH - shape.radius, snappedX));
        snappedY = Math.max(shape.radius, Math.min(CANVAS_HEIGHT - shape.radius, snappedY));
      } else {
        snappedX = Math.max(0, Math.min(CANVAS_WIDTH - (shape.width || 0), snappedX));
        snappedY = Math.max(0, Math.min(CANVAS_HEIGHT - (shape.height || 0), snappedY));
      }
      
      // Update the node position
      const node = shapeNodesRef.current.get(shapeId);
      if (node) {
        node.position({ x: snappedX, y: snappedY });
        
        // Redraw the layer
        const stage = stageRef?.current;
        if (stage) {
          const layer = stage.findOne('Layer');
          layer?.batchDraw();
        }
      }
    }
  }, [stageRef, shapes, gridEnabled, selectedIds]);

  /**
   * Update multiple shapes atomically in a single Firestore write
   * Prevents race conditions during multi-select and group drag
   * Optionally updates group bounds in the same transaction
   */
  const updateShapesAtomic = async (updates: Map<string, { x: number; y: number }>, groupId?: string) => {
    if (updates.size === 0) return;
    
    const canvasRef = doc(db, 'canvases', GLOBAL_CANVAS_ID);
    const canvasSnap = await getDoc(canvasRef);
    const currentData = canvasSnap.data() as any;
    
    const now = Timestamp.now();
    const updatedShapes = currentData.shapes.map((shape: any) => {
      const update = updates.get(shape.id);
      if (update) {
        return {
          ...shape,
          x: update.x,
          y: update.y,
          lastModifiedAt: now,
        };
      }
      return shape;
    });

    // If a groupId is provided, calculate and update group bounds
    let updatedGroups = currentData.groups || [];
    if (groupId) {
      const group = updatedGroups.find((g: any) => g.id === groupId);
      if (group) {
        // Get shapes in this group using the updated positions
        const groupShapes = updatedShapes.filter((s: any) => group.shapeIds.includes(s.id));
        
        // Calculate new bounding box (accounting for different shape types)
        const bounds = groupShapes.map((shape: any) => {
          if (shape.type === 'circle' && shape.radius) {
            // Circle: x,y is the center, calculate bounding box from radius
            return {
              x: shape.x - shape.radius,
              y: shape.y - shape.radius,
              width: shape.radius * 2,
              height: shape.radius * 2
            };
          } else if (shape.type === 'line' && shape.points) {
            // Line: calculate bounding box from points
            const [x1, y1, x2, y2] = shape.points;
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            return {
              x: shape.x + minX,
              y: shape.y + minY,
              width: maxX - minX,
              height: maxY - minY
            };
          } else {
            // Rectangle/Text: standard bounding box
            return {
              x: shape.x,
              y: shape.y,
              width: shape.width || 0,
              height: shape.height || 0
            };
          }
        });
        
        const minX = Math.min(...bounds.map((b: { x: number }) => b.x));
        const minY = Math.min(...bounds.map((b: { y: number }) => b.y));
        const maxX = Math.max(...bounds.map((b: { x: number; width: number }) => b.x + b.width));
        const maxY = Math.max(...bounds.map((b: { y: number; height: number }) => b.y + b.height));
        
        // Update group bounds
        updatedGroups = updatedGroups.map((g: any) => 
          g.id === groupId
            ? { ...g, x: minX, y: minY, width: maxX - minX, height: maxY - minY, lastModifiedAt: now }
            : g
        );
      }
    }

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      groups: updatedGroups,
      lastUpdated: serverTimestamp(),
    });
  };

  /**
   * Handle shape drag end - disables auto-pan and updates position(s)
   */
  const handleShapeDragEnd = useCallback(async (shapeId: string, x: number, y: number) => {
    setIsDraggingShape(false);
    isDraggingShapeRef.current = false; // Allow panning again
    
    // Clear alignment guides
    setAlignmentGuides([]);
    
    // Clear any pan state to prevent accidental panning
    setIsPanning(false);
    panStartRef.current = null;
    
    const groupDrag = groupDragRef.current;
    const multiSelectDrag = multiSelectDragRef.current;
    
    if (groupDrag) {
      // Dragging a group - calculate delta and move all shapes atomically
      const initialPos = groupDrag.initialPositions.get(shapeId);
      if (initialPos) {
        const deltaX = x - initialPos.x;
        const deltaY = y - initialPos.y;
        
        try {
          // Calculate all new positions
          const updates = new Map<string, { x: number; y: number }>();
          Array.from(groupDrag.initialPositions.entries()).forEach(([id, pos]) => {
            updates.set(id, {
              x: pos.x + deltaX,
              y: pos.y + deltaY
            });
          });
          
          // Apply all updates in a single atomic Firestore write (including group bounds)
          await updateShapesAtomic(updates, groupDrag.groupId);
          
          // Unlock all shapes in the group
          const group = groups.find(g => g.id === groupDrag.groupId);
          if (group) {
            await Promise.all(
              group.shapeIds.map(id => 
                unlockShape(id).catch(err => console.error('Error unlocking group shape:', err))
              )
            );
          }
        } catch (error) {
          console.error('Error updating group positions:', error);
          toast.error('Failed to move group');
        }
      }
      
      groupDragRef.current = null;
    } else if (multiSelectDrag) {
      // Dragging multiple selected shapes - calculate delta and move all atomically
      const initialPos = multiSelectDrag.initialPositions.get(shapeId);
      if (initialPos) {
        const deltaX = x - initialPos.x;
        const deltaY = y - initialPos.y;
        
        try {
          // Calculate all new positions
          const updates = new Map<string, { x: number; y: number }>();
          Array.from(multiSelectDrag.initialPositions.entries()).forEach(([id, pos]) => {
            updates.set(id, {
              x: pos.x + deltaX,
              y: pos.y + deltaY
            });
          });
          
          // Apply all updates in a single atomic Firestore write
          await updateShapesAtomic(updates);
          
          // Unlock all selected shapes
          await Promise.all(
            Array.from(multiSelectDrag.initialPositions.keys()).map(id =>
              unlockShape(id).catch(err => console.error('Error unlocking selected shape:', err))
            )
          );
        } catch (error) {
          console.error('Error updating selected shapes positions:', error);
          toast.error('Failed to move selected shapes');
        }
      }
      
      multiSelectDragRef.current = null;
    } else {
      // Normal single shape drag
      try {
        // Check if this shape belongs to a group
        const shapeGroup = groups.find(g => g.shapeIds.includes(shapeId));
        
        if (shapeGroup) {
          // Shape is in a group - use atomic update to update both shape and group bounds
          const updates = new Map<string, { x: number; y: number }>();
          updates.set(shapeId, { x, y });
          await updateShapesAtomic(updates, shapeGroup.id);
        } else {
          // Shape is not in a group - use normal update
          await updateShape(shapeId, { x, y });
        }
        
        await unlockShape(shapeId);
      } catch (error) {
        console.error('Error updating shape position:', error);
        toast.error('Failed to move shape');
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
   * Handle Clear All - wraps context clearAll and clears local lasso state
   */
  const handleClearAll = async () => {
    // Clear lasso drawing state
    setIsLassoDrawing(false);
    setLassoPath([]);
    
    // Call the context clearAll which will clear shapes, groups, connections, and selections
    await clearAll();
  };

  /**
   * Handle clicking on the stage background to deselect shapes
   */
  /**
   * Handle stage click - deselects shapes when clicking empty area
   * Also handles box select start
   */
  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Don't handle clicks while panning (Space key pressed)
    if (isSpacePressed) return;
    
    // Don't deselect if we just completed a box selection
    if (justCompletedBoxSelect.current) {
      justCompletedBoxSelect.current = false;
      return;
    }
    
    // Don't deselect if we just completed a lasso selection
    if (justCompletedLassoSelect.current) {
      justCompletedLassoSelect.current = false;
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
   * Handle stage/shape mouse down - start box select or drawing
   */
  const handleStageMouseDown = async (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const canvasX = (pos.x - stage.x()) / stage.scaleX();
    const canvasY = (pos.y - stage.y()) / stage.scaleY();
    
    // Handle placement mode FIRST (click-to-place workflow shapes)
    // This allows placing shapes even when clicking on top of other shapes
    if (isPlacementMode && placementShapeType && placementPreview && e.evt.button === 0) {
      const shapeSize = defaultWorkflowShapeSizes[placementShapeType] || { width: 120, height: 80 };
      
      // Calculate highest z-index to place new shape on top
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      const newZIndex = maxZIndex + 1;
      
      // Place shape at the preview position
      await addShape(placementShapeType as ShapeType['type'], 
        { x: placementPreview.x, y: placementPreview.y }, 
        { 
          width: shapeSize.width, 
          height: shapeSize.height,
          text: placementShapeType.charAt(0).toUpperCase() + placementShapeType.slice(1), // Default text
          zIndex: newZIndex // Place on top of all existing shapes
        }
      );
      
      // Exit placement mode after placing one shape
      exitPlacementMode();
      return;
    }
    
    // Handle drawing mode SECOND (drag to create shapes)
    // This allows drawing even when clicking on top of other shapes
    // No need to check if clicked on empty - just start drawing!
    if (isDrawingMode && drawingShapeType && e.evt.button === 0) {
      drawingStartRef.current = { x: canvasX, y: canvasY };
      setDrawingPreview({ x: canvasX, y: canvasY, width: 0, height: 0 });
      return;
    }
    
    // Only proceed with selection/panning if clicked on empty space
    const clickedOnEmpty = e.target === stage;
    if (!clickedOnEmpty) return;
    
    // Start panning if Space is pressed (but not if dragging a shape)
    if (isSpacePressed && !isDraggingShapeRef.current) {
      setIsPanning(true);
      panStartRef.current = {
        x: pos.x,
        y: pos.y,
        stageX: stage.x(),
        stageY: stage.y(),
      };
      return;
    }
    
    // Start selection based on active mode
    if (e.evt.button === 0) {
      if (selectionMode === 'lasso') {
        if (!isLassoDrawing) {
          // First click: start lasso
          setIsLassoDrawing(true);
          setLassoPath([{ x: canvasX, y: canvasY }]);
        } else {
          // Second click: complete lasso selection
          if (lassoPath.length > 2) {
            selectShapesInLasso(lassoPath);
            justCompletedLassoSelect.current = true;
          }
          // Clear lasso state but stay in lasso mode
          setIsLassoDrawing(false);
          setLassoPath([]);
        }
      } else {
        setIsBoxSelecting(true);
        setBoxSelect({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
      }
    }
  };
  
  /**
   * Handle stage mouse move - update box select or drawing preview
   */
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const canvasX = (pos.x - stage.x()) / stage.scaleX();
    const canvasY = (pos.y - stage.y()) / stage.scaleY();
    
    // Handle placement preview (ghost shape follows cursor)
    if (isPlacementMode && placementShapeType) {
      const shapeSize = defaultWorkflowShapeSizes[placementShapeType] || { width: 120, height: 80 };
      // Center the preview on cursor
      setPlacementPreview({ 
        x: canvasX - shapeSize.width / 2, 
        y: canvasY - shapeSize.height / 2 
      });
      return;
    }
    
    // Handle drawing preview
    if (isDrawingMode && drawingStartRef.current) {
      const start = drawingStartRef.current;
      const width = canvasX - start.x;
      const height = canvasY - start.y;
      setDrawingPreview({ x: start.x, y: start.y, width, height });
      return;
    }
    
    // Handle lasso drawing - add point to path as mouse moves
    if (isLassoDrawing && selectionMode === 'lasso') {
      setLassoPath(prev => {
        if (prev.length === 0) return prev;
        
        // Only add point if it's at least 5px away from last point (reduce path complexity)
        const lastPoint = prev[prev.length - 1];
        const dx = canvasX - lastPoint.x;
        const dy = canvasY - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= 5) {
          return [...prev, { x: canvasX, y: canvasY }];
        }
        return prev;
      });
      return;
    }
    
    // Handle panning (but not if dragging a shape)
    if (isPanning && panStartRef.current && !isDraggingShapeRef.current) {
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
      setBoxSelect({ ...boxSelect, x2: canvasX, y2: canvasY });
    }
  };
  
  /**
   * Handle stage mouse up - complete box select or drawing (lasso uses click-to-end)
   */
  const handleStageMouseUp = async () => {
    // Handle drawing completion
    if (isDrawingMode && drawingStartRef.current && drawingPreview && drawingShapeType) {
      const { x, y, width, height } = drawingPreview;
      
      // Only create shape if it has meaningful size (at least 5px in each dimension)
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        // Normalize coordinates (handle negative width/height from dragging in different directions)
        const normalizedX = width < 0 ? x + width : x;
        const normalizedY = height < 0 ? y + height : y;
        const normalizedWidth = Math.abs(width);
        const normalizedHeight = Math.abs(height);
        
        // Calculate highest z-index to place new shape on top
        const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
        const newZIndex = maxZIndex + 1;
        
        // Type assertion since TypeScript doesn't narrow type correctly
        const shapeType = drawingShapeType as ShapeType['type'];
        
        // Create shape based on type
        if (shapeType === 'circle') {
          // For circles, use the smaller dimension as the radius to maintain aspect ratio
          // Circles are positioned by their CENTER point in Konva
          const radius = Math.min(normalizedWidth, normalizedHeight) / 2;
          const centerX = normalizedX + radius;
          const centerY = normalizedY + radius;
          await addShape(shapeType, { x: centerX, y: centerY }, { 
            radius, 
            width: radius * 2, 
            height: radius * 2,
            zIndex: newZIndex 
          });
        } else if (shapeType === 'line') {
          // For lines, calculate points relative to the starting position
          // Points are relative to the line's x,y position
          const startX = x;
          const startY = y;
          
          await addShape(shapeType, { x: startX, y: startY }, { 
            points: [0, 0, width, height] as [number, number, number, number],
            width: normalizedWidth,
            height: normalizedHeight,
            zIndex: newZIndex
          });
        } else {
          // For rectangles and text
          await addShape(shapeType, { x: normalizedX, y: normalizedY }, { 
            width: normalizedWidth, 
            height: normalizedHeight,
            zIndex: newZIndex
          });
        }
      }
      
      exitDrawingMode();
      return;
    }
    
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
    // Prevent this handler from running if a shape is being dragged
    // or if the event target is not the stage itself
    if (isDraggingShapeRef.current) {
      return;
    }
    
    const stage = e.target.getStage();
    if (!stage || e.target !== stage) {
      return; // Event came from a shape, not the stage
    }
    
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
  /**
   * Reset view to fit all shapes in viewport
   * Calculates bounding box of all shapes and zooms to fit with padding
   */
  const handleResetView = () => {
    if (shapes.length === 0) {
      // No shapes, just center at default zoom
      setStageScale(1.0);
      centerCanvasAtMinZoom(dimensions, 1.0);
      return;
    }
    
    // Calculate bounding box of all shapes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    shapes.forEach(shape => {
      let shapeMinX, shapeMinY, shapeMaxX, shapeMaxY;
      
      // Handle different shape types
      if (shape.type === 'circle') {
        const radius = shape.radius || 50;
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + radius * 2;
        shapeMaxY = shape.y + radius * 2;
      } else if (shape.type === 'line' && shape.points) {
        const [x1, y1, x2, y2] = shape.points;
        shapeMinX = Math.min(x1, x2);
        shapeMinY = Math.min(y1, y2);
        shapeMaxX = Math.max(x1, x2);
        shapeMaxY = Math.max(y1, y2);
      } else if (shape.type === 'ellipse') {
        // Ellipse is centered, adjust bounds
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + (shape.width || 0);
        shapeMaxY = shape.y + (shape.height || 0);
      } else {
        // Standard shapes (rectangle, triangles, etc)
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + (shape.width || 0);
        shapeMaxY = shape.y + (shape.height || 0);
      }
      
      minX = Math.min(minX, shapeMinX);
      minY = Math.min(minY, shapeMinY);
      maxX = Math.max(maxX, shapeMaxX);
      maxY = Math.max(maxY, shapeMaxY);
    });
    
    // Calculate bounding box dimensions
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    const boundingCenterX = minX + boundingWidth / 2;
    const boundingCenterY = minY + boundingHeight / 2;
    
    // Add padding (50px in canvas coordinates)
    const padding = 50;
    
    // Calculate scale to fit bounding box with padding in viewport
    const scaleX = dimensions.width / (boundingWidth + padding * 2);
    const scaleY = dimensions.height / (boundingHeight + padding * 2);
    const newScale = Math.min(scaleX, scaleY, MAX_ZOOM); // Don't exceed max zoom
    const clampedScale = Math.max(newScale, MIN_ZOOM); // Don't go below min zoom
    
    // Calculate position to center the bounding box
    const newX = dimensions.width / 2 - boundingCenterX * clampedScale;
    const newY = dimensions.height / 2 - boundingCenterY * clampedScale;
    
    setStageScale(clampedScale);
    setStagePos({ x: newX, y: newY });
  };

  /**
   * Reset zoom to 100% (scale = 1.0) while maintaining current center point
   */
  const handleResetZoom = () => {
    const stage = stageRef?.current;
    if (!stage) return;
    
    setStageScale(1.0);
    
    // Keep the same center point when resetting zoom
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };
    
    const mousePointTo = {
      x: (center.x - stage.x()) / stage.scaleX(),
      y: (center.y - stage.y()) / stage.scaleY(),
    };
    
    const newPos = {
      x: center.x - mousePointTo.x * 1.0,
      y: center.y - mousePointTo.y * 1.0,
    };
    
    setStagePos(newPos);
  };

  /**
   * Handle add shape button click - enter drawing or placement mode
   */
  const handleAddShape = (type: ShapeType['type']) => {
    // Workflow shapes and form elements use placement mode (click-to-place with fixed sizes)
    const placementModeTypes = [
      'process', 'decision', 'startEnd', 'document', 'database', // Workflow shapes
      'button', 'textInput', 'textarea', 'dropdown', 'checkbox', 'radio', 'toggle', 'slider' // Form elements
    ];
    
    if (placementModeTypes.includes(type)) {
      // Use placement mode for workflow shapes and form elements (click-to-place)
      setIsPlacementMode(true);
      setPlacementShapeType(type);
      setPlacementPreview(null); // Will be set on mouse move
    } else {
      // Use drawing mode for basic shapes (drag-to-draw)
      setIsDrawingMode(true);
      setDrawingShapeType(type);
    }
  };

  /**
   * Exit drawing mode and reset state
   */
  const exitDrawingMode = () => {
    setIsDrawingMode(false);
    setDrawingShapeType(null);
    setDrawingPreview(null);
    drawingStartRef.current = null;
  };
  
  /**
   * Exit placement mode (click-to-place) and reset state
   */
  const exitPlacementMode = () => {
    setIsPlacementMode(false);
    setPlacementShapeType(null);
    setPlacementPreview(null);
  };

  /**
   * Handle bring to front (move to top of z-index)
   */
  const handleBringToFront = useCallback(async (shapeId: string) => {
    const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
    await updateShape(shapeId, { zIndex: maxZIndex + 1 });
  }, [shapes, updateShape]);

  /**
   * Handle send to back (move to bottom of z-index)
   */
  const handleSendToBack = useCallback(async (shapeId: string) => {
    const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0), 0);
    await updateShape(shapeId, { zIndex: minZIndex - 1 });
  }, [shapes, updateShape]);

  /**
   * Handle right-click on shape
   */
  const handleShapeContextMenu = useCallback((e: any, shapeId: string) => {
    e.evt.preventDefault();
    const stage = stageRef?.current;
    if (!stage) return;

    // Get screen position of the click
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Select the shape if not already selected
    if (!selectedIds.includes(shapeId)) {
      selectShape(shapeId);
    }

    // Show context menu at cursor position
    setContextMenu({
      x: pointerPos.x,
      y: pointerPos.y,
      shapeId,
    });
  }, [selectedIds, selectShape, stageRef]);

  /**
   * Render shape based on type
   */
  const renderShapeByType = (shape: ShapeType, shapeIsSelected: boolean) => {
    // Disable dragging when:
    // 1. Space key is pressed (panning mode), OR
    // 2. Currently editing this shape, OR
    // 3. Just finished editing this shape (grace period)
    const isDraggingDisabled = isSpacePressed || editingShapeId === shape.id || justFinishedEditingId === shape.id;
    
    const commonProps = {
      id: shape.id,
      isSelected: shapeIsSelected,
      isLocked: shape.isLocked,
      lockedBy: shape.lockedBy,
      currentUserId: currentUser?.uid || null,
      isDraggingDisabled, // Pass this to shapes that support it
      listening: !isSpacePressed, // Make shapes transparent to events when panning
      onSelect: (e?: any) => {
        // Don't allow selection while panning (Space key pressed)
        if (isSpacePressed) return;
        
        // Don't allow selection during drawing/placement mode
        if (isDrawingMode || isPlacementMode) return;
        
        const shiftKey = e?.evt?.shiftKey || false;
        
        // Two-click selection for grouped shapes
        if (shape.groupId && !shiftKey) {
          const now = Date.now();
          const lastSelectedGroup = lastSelectedGroupRef.current;
          
          // Check if we just selected this group (any shape in it) within 500ms
          if (lastSelectedGroup && lastSelectedGroup.groupId === shape.groupId && (now - lastSelectedGroup.timestamp) < 500) {
            // Second click on the group: select just this individual shape
            selectShape(shape.id, { shift: false });
            lastSelectedGroupRef.current = null; // Reset
          } else {
            // First click on the group: select the entire group
            const group = groups.find(g => g.id === shape.groupId);
            if (group) {
              selectMultipleShapes(group.shapeIds);
              lastSelectedGroupRef.current = { groupId: shape.groupId, timestamp: now };
            } else {
              // Group not found, select just the shape
              selectShape(shape.id, { shift: false });
            }
          }
        } else {
          // Not in a group or shift-click: normal selection
          selectShape(shape.id, { shift: shiftKey });
          lastSelectedGroupRef.current = null; // Reset
        }
      },
      onDblClick: (e?: any) => {
        // Double-click to edit text (for all shapes except line)
        if (shape.type !== 'line') {
          e?.evt?.preventDefault();
          e?.evt?.stopPropagation();
          setEditingShapeId(shape.id);
        }
      },
      onDragStart: () => {
        // Don't allow dragging while panning (Space key pressed)
        if (isSpacePressed) return;
        
        // Prevent drag if editing just finished (300ms grace period)
        if (justFinishedEditingId === shape.id) {
          return;
        }
        handleShapeDragStart(shape.id);
      },
      onDragMove: (x: number, y: number) => {
        // Don't allow dragging while panning (Space key pressed)
        if (isSpacePressed) return;
        
        // Prevent drag move if editing just finished
        if (justFinishedEditingId === shape.id) {
          return;
        }
        handleShapeDragMove(shape.id, x, y);
      },
      onDragEnd: (x: number, y: number) => {
        // Don't allow dragging while panning (Space key pressed)
        if (isSpacePressed) return;
        
        // Prevent drag end if editing just finished
        if (justFinishedEditingId === shape.id) {
          return;
        }
        handleShapeDragEnd(shape.id, x, y);
      },
      onContextMenu: (e: any) => handleShapeContextMenu(e, shape.id),
      onRef: (node: any) => {
        if (node) {
          shapeNodesRef.current.set(shape.id, node);
        } else {
          shapeNodesRef.current.delete(shape.id);
        }
      },
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
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
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
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
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
      
      case 'process':
        return (
          <ProcessBox
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
            cornerRadius={shape.cornerRadius || 8}
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
          />
        );
      
      case 'decision':
        return (
          <DecisionDiamond
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
          />
        );
      
      case 'startEnd':
        return (
          <StartEndOval
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
          />
        );
      
      case 'document':
        return (
          <DocumentShape
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
          />
        );
      
      case 'database':
        return (
          <DatabaseShape
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
          />
        );
      
      case 'triangle':
        return (
          <Triangle
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
          />
        );
      
      case 'rightTriangle':
        return (
          <RightTriangle
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
          />
        );
      
      case 'hexagon':
        return (
          <Hexagon
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
          />
        );
      
      case 'octagon':
        return (
          <Octagon
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
          />
        );
      
      case 'ellipse':
        return (
          <Ellipse
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            textAlign={shape.textAlign}
            verticalAlign={shape.verticalAlign}
            fontWeight={shape.fontWeight}
            fontStyle={shape.fontStyle}
            textDecoration={shape.textDecoration}
            textColor={shape.textColor}
          />
        );
      
      case 'textInput':
        return (
          <TextInput
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'dropdown':
        return (
          <Dropdown
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'radio':
        return (
          <Radio
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'checkbox':
        return (
          <Checkbox
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'button':
        return (
          <Button
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
            text={shape.text} // Add text prop for configurable button text
          />
        );
      
      case 'toggle':
        return (
          <Toggle
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
          />
        );
      
      case 'slider':
        return (
          <Slider
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
            rotation={shape.rotation}
            scaleX={shape.scaleX}
            scaleY={shape.scaleY}
            formOptions={shape.formOptions}
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
  
  // Get selected connection for property panel (must be before early return)
  const selectedConnection = connections.find((conn) => conn.id === selectedConnectionId) || null;

  /**
   * Handle property updates from PropertyPanel
   * IMPORTANT: Must be declared before any early returns to follow Rules of Hooks
   */
  const handlePropertyUpdate = useCallback(async (updates: Partial<ShapeType>) => {
    if (!selectedId) return;
    
    try {
      await updateShape(selectedId, updates);
    } catch (error) {
      console.error('Error updating shape properties:', error);
      toast.error('Failed to update shape properties');
    }
  }, [selectedId, updateShape, toast]);

  /**
   * Handle connection updates from PropertyPanel
   * IMPORTANT: Must be declared before any early returns to follow Rules of Hooks
   */
  const handleConnectionUpdate = useCallback(async (updates: Partial<Connection>) => {
    if (!selectedConnectionId) return;
    
    try {
      await updateConnection(selectedConnectionId, updates);
    } catch (error) {
      console.error('Error updating connection properties:', error);
      toast.error('Failed to update connection properties');
    }
  }, [selectedConnectionId, updateConnection, toast]);

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

      // Don't show transformer for form elements (they have fixed sizes)
      const formElementTypes = ['button', 'textInput', 'textarea', 'dropdown', 'checkbox', 'radio', 'toggle', 'slider'];
      if (formElementTypes.includes(selectedShape.type)) {
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
        // For text shapes, width/height are already updated in onTransform, so use node values directly
        // For rectangles, calculate from scale
        if (shape.type === 'text') {
          updates.width = node.width();
          updates.height = node.height();
        } else {
          updates.width = shape.width * scaleX;
          updates.height = shape.height * scaleY;
        }
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
      style={{ cursor: isSpacePressed ? 'grab' : isPanning ? 'grabbing' : isDrawingMode ? 'crosshair' : 'default' }}
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
          
          // Track hovered shape for showing anchors
          const target = e.target;
          if (target === e.target.getStage()) {
            // Hovering over empty space
            setHoveredShapeId(null);
          } else {
            let shapeId = target.id();
            
            // Check if hovering over an anchor point (name format: "anchor-{shapeId}")
            const targetName = target.name();
            if (targetName && targetName.startsWith('anchor-')) {
              shapeId = targetName.replace('anchor-', '');
            }
            
            // If still no ID, walk up the parent chain
            if (!shapeId) {
              let currentNode: any = target;
              while (!shapeId && currentNode.parent && currentNode.parent.getClassName() !== 'Stage') {
                currentNode = currentNode.parent;
                shapeId = currentNode.id();
              }
            }
            
            if (shapeId && shapes.some(s => s.id === shapeId)) {
              setHoveredShapeId(shapeId);
            } else {
              // Clear hover if not a valid shape
              setHoveredShapeId(null);
            }
          }
        }}
        onMouseUp={handleStageMouseUp}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onContextMenu={(e) => {
          e.evt.preventDefault(); // Prevent default browser context menu
        }}
      >
        <Layer>
          {/* White Background */}
          <Rect
            x={0}
            y={0}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="white"
            listening={false}
          />
          
          {/* Grid Overlay */}
          <GridOverlay visible={gridEnabled} />
          
          {/* Render all shapes sorted by zIndex */}
          {sortedShapes.map((shape) => renderShapeByType(shape, isSelected(shape.id)))}
          
          {/* Transparent overlay during drawing/placement mode to intercept mouse events */}
          {(isDrawingMode || isPlacementMode) && (
            <Rect
              x={0}
              y={0}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              fill="transparent"
              listening={true}
            />
          )}
          
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
          
          {/* Connectors - Render connections between shapes */}
          {connections.map(connection => (
            <Connector
              key={connection.id}
              connection={connection}
              shapes={shapes}
              shapeNodes={shapeNodesRef.current}
              isSelected={selectedConnectionId === connection.id}
              onSelect={() => selectConnection(connection.id)}
              onUpdateConnection={async (updates) => {
                try {
                  await updateConnection(connection.id, updates);
                } catch (error) {
                  console.error('Error updating connection:', error);
                  toast.error('Failed to update connection');
                }
              }}
              onContextMenu={(e) => {
                e.cancelBubble = true;
                // TODO: Add connection context menu if needed
              }}
            />
          ))}
          
          {/* Anchor points - Show on selected OR hovered shapes OR shapes with active connection start */}
          {shapes.filter(shape => 
            supportsAnchors(shape) && (
              (selectedIds.length === 1 && shape.id === selectedId) || 
              shape.id === hoveredShapeId ||
              (connectionStart && shape.id === connectionStart.shapeId)
            )
          ).map(shape => (
            <ShapeAnchors
              key={`anchors-${shape.id}`}
              shape={shape}
              konvaNode={shapeNodesRef.current.get(shape.id) || null}
              highlightedAnchor={connectionStart && connectionStart.shapeId === shape.id ? connectionStart.anchor as any : null}
              activeAnchor={connectionStart && connectionStart.shapeId === shape.id ? connectionStart.anchor as any : null}
              onAnchorClick={async (anchor) => {
                if (!connectionStart) {
                  // First click: start connection
                  setConnectionStart({ shapeId: shape.id, anchor: String(anchor) });
                } else if (connectionStart.shapeId === shape.id && connectionStart.anchor === anchor) {
                  // Clicked same anchor: cancel
                  setConnectionStart(null);
                } else {
                  // Second click: create connection
                  try {
                    // Ensure anchor values are valid strings
                    const fromAnchor = String(connectionStart.anchor) as 'top' | 'right' | 'bottom' | 'left';
                    const toAnchor = String(anchor) as 'top' | 'right' | 'bottom' | 'left';
                    
                    await addConnection({
                      fromShapeId: connectionStart.shapeId,
                      fromAnchor: fromAnchor,
                      toShapeId: shape.id,
                      toAnchor: toAnchor,
                      arrowType: 'end',
                      stroke: '#000000',
                      strokeWidth: 2,
                      createdBy: currentUser?.uid || 'anonymous',
                    });
                  } catch (error) {
                    console.error('Error creating connection:', error);
                    toast.error('Failed to create connection');
                  }
                  setConnectionStart(null);
                }
              }}
            />
          ))}
          
          {/* Smart Guides for alignment during drag */}
          {alignmentGuides.length > 0 && (
            <SmartGuides guides={alignmentGuides} />
          )}
          
          {/* Transformer for resize and rotate */}
          <Transformer
            ref={transformerRef}
            keepRatio={selectedShape ? ['process', 'decision', 'startEnd', 'document', 'database'].includes(selectedShape.type) : false}
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
          
          {/* Lasso selection visualization */}
          {isLassoDrawing && lassoPath.length > 0 && (
            <KonvaLine
              points={lassoPath.flatMap(point => [point.x, point.y])}
              stroke="rgb(147, 51, 234)" // Purple color
              strokeWidth={2 / stageScale}
              fill="rgba(147, 51, 234, 0.1)"
              closed={false}
              listening={false}
              dash={[5 / stageScale, 5 / stageScale]}
            />
          )}
          
          {/* Drawing preview visualization */}
          {isDrawingMode && drawingPreview && drawingShapeType && (() => {
            const normalizedX = drawingPreview.width < 0 ? drawingPreview.x + drawingPreview.width : drawingPreview.x;
            const normalizedY = drawingPreview.height < 0 ? drawingPreview.y + drawingPreview.height : drawingPreview.y;
            const absWidth = Math.abs(drawingPreview.width);
            const absHeight = Math.abs(drawingPreview.height);
            
            if (drawingShapeType === 'circle') {
              // Circle preview - use smaller dimension as diameter to maintain aspect ratio
              const radius = Math.min(absWidth, absHeight) / 2;
              const centerX = normalizedX + radius;
              const centerY = normalizedY + radius;
              
              return (
                <KonvaCircle
                  x={centerX}
                  y={centerY}
                  radius={radius}
                  fill="rgba(34, 197, 94, 0.1)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth={2 / stageScale}
                  dash={[10 / stageScale, 5 / stageScale]}
                  listening={false}
                />
              );
            } else if (drawingShapeType === 'line') {
              // Line preview - from start to current position
              return (
                <KonvaLine
                  points={[drawingPreview.x, drawingPreview.y, drawingPreview.x + drawingPreview.width, drawingPreview.y + drawingPreview.height]}
                  stroke="rgb(34, 197, 94)"
                  strokeWidth={2 / stageScale}
                  dash={[10 / stageScale, 5 / stageScale]}
                  listening={false}
                />
              );
            } else {
              // Rectangle/Text preview
              return (
                <Rect
                  x={normalizedX}
                  y={normalizedY}
                  width={absWidth}
                  height={absHeight}
                  fill="rgba(34, 197, 94, 0.1)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth={2 / stageScale}
                  dash={[10 / stageScale, 5 / stageScale]}
                  listening={false}
                />
              );
            }
          })()}
          
          {/* Placement preview (ghost shape follows cursor) */}
          {isPlacementMode && placementPreview && placementShapeType && (() => {
            const shapeSize = defaultWorkflowShapeSizes[placementShapeType] || { width: 120, height: 80 };
            const ghostProps = {
              x: placementPreview.x,
              y: placementPreview.y,
              width: shapeSize.width,
              height: shapeSize.height,
              fill: "rgba(59, 130, 246, 0.2)", // Blue with low opacity
              stroke: "rgb(59, 130, 246)", // Blue
              strokeWidth: 2 / stageScale,
              dash: [10 / stageScale, 5 / stageScale],
              listening: false,
              opacity: 0.6,
            };
            
            // Render appropriate ghost shape based on type
            if (placementShapeType === 'process') {
              return (
                <Rect
                  {...ghostProps}
                  cornerRadius={8}
                />
              );
            } else if (placementShapeType === 'decision') {
              // Diamond - render as rotated square
              const centerX = ghostProps.x + ghostProps.width / 2;
              const centerY = ghostProps.y + ghostProps.height / 2;
              const size = Math.min(ghostProps.width, ghostProps.height);
              return (
                <Rect
                  x={centerX - size / 2}
                  y={centerY - size / 2}
                  width={size}
                  height={size}
                  rotation={45}
                  fill={ghostProps.fill}
                  stroke={ghostProps.stroke}
                  strokeWidth={ghostProps.strokeWidth}
                  dash={ghostProps.dash}
                  listening={false}
                  opacity={ghostProps.opacity}
                />
              );
            } else if (placementShapeType === 'startEnd') {
              // Oval
              return (
                <KonvaCircle
                  x={ghostProps.x + ghostProps.width / 2}
                  y={ghostProps.y + ghostProps.height / 2}
                  radiusX={ghostProps.width / 2}
                  radiusY={ghostProps.height / 2}
                  fill={ghostProps.fill}
                  stroke={ghostProps.stroke}
                  strokeWidth={ghostProps.strokeWidth}
                  dash={ghostProps.dash}
                  listening={false}
                  opacity={ghostProps.opacity}
                />
              );
            } else {
              // document and database - just show as rectangle for ghost
              return (
                <Rect {...ghostProps} />
              );
            }
          })()}
          
          {/* Comment Badges - Show on shapes that have comments */}
          {shapes
            .filter(shape => getShapeCommentCount(shape.id) > 0)
            .map(shape => {
              // Calculate badge position at top-right corner of shape
              const badgeX = shape.x + shape.width + (5 / stageScale); // Offset from top-right
              const badgeY = shape.y - (5 / stageScale); // Slightly above top edge
              
              return (
                <CommentBadge
                  key={`comment-badge-${shape.id}`}
                  x={badgeX}
                  y={badgeY}
                  commentCount={getShapeCommentCount(shape.id)}
                  unresolvedCount={getShapeUnresolvedCommentCount(shape.id)}
                  scale={stageScale}
                  onClick={() => {
                    // Select the shape and open comments panel
                    selectShape(shape.id);
                    if (!showCommentsPanel) {
                      setShowCommentsPanel(true);
                      if (showComponentLibrary) {
                        setShowComponentLibrary(false);
                      }
                      setTopPanel('comments');
                    }
                  }}
                />
              );
            })}
        </Layer>
      </Stage>

      {/* Inline Text Editor - Show when double-clicking workflow shapes */}
      {editingShapeId && (() => {
        const editingShape = shapes.find(s => s.id === editingShapeId);
        if (!editingShape) return null;
        
        return (
          <InlineTextEditor
            shape={editingShape}
            stageScale={stageScale}
            stageX={stagePos.x}
            stageY={stagePos.y}
            onUpdate={(updates) => {
              // Update shape without closing editor (for formatting changes)
              updateShape(editingShapeId, updates);
            }}
            onSave={(updates) => {
              // Save and close editor (for Enter key or blur)
              updateShape(editingShapeId, updates);
              setEditingShapeId(null);
              
              // Prevent immediate dragging after editing
              setJustFinishedEditingId(editingShapeId);
              
              // Clear the flag after a short delay
              if (editingTimeoutRef.current) {
                clearTimeout(editingTimeoutRef.current);
              }
              editingTimeoutRef.current = setTimeout(() => {
                setJustFinishedEditingId(null);
                editingTimeoutRef.current = null;
              }, 300); // 300ms delay before dragging is re-enabled
            }}
            onCancel={() => setEditingShapeId(null)}
          />
        );
      })()}

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

      {/* Property Panel (shows when shape or connection selected) */}
      <PropertyPanel
        shape={selectedShape}
        connection={selectedConnection}
        onUpdate={handlePropertyUpdate}
        onUpdateConnection={handleConnectionUpdate}
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

      {/* Drawing Mode Indicator */}
      {isDrawingMode && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 pointer-events-none">
          <div className="text-lg font-bold">Drawing {drawingShapeType}</div>
          <div className="text-sm">Click and drag to create • Press ESC to cancel</div>
        </div>
      )}
      
      {/* Placement Mode Indicator */}
      {isPlacementMode && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 pointer-events-none">
          <div className="text-lg font-bold">Placing {placementShapeType}</div>
          <div className="text-sm">Click to place shape • Press ESC to cancel</div>
        </div>
      )}

      {/* Canvas Controls */}
      <CanvasControls
        zoom={stageScale}
        minZoom={MIN_ZOOM}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onResetZoom={handleResetZoom}
        onAddShape={handleAddShape}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onClearAll={handleClearAll}
        onExport={(format, exportType) => {
          try {
            exportCanvas(format, exportType);
            toast.success(`Exported as ${format.toUpperCase()}`);
          } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to export canvas');
          }
        }}
        isDrawingMode={isDrawingMode}
        drawingShapeType={drawingShapeType}
        isPlacementMode={isPlacementMode}
        placementShapeType={placementShapeType}
        hasSelection={selectedIds.length > 0}
        gridEnabled={gridEnabled}
        onToggleGrid={toggleGrid}
        selectionMode={selectionMode}
        onToggleSelectionMode={() => setSelectionMode(prev => prev === 'box' ? 'lasso' : 'box')}
        showComponentLibrary={showComponentLibrary}
        onToggleComponentLibrary={() => {
          // Mutually exclusive panels
          if (showComponentLibrary) {
            setShowComponentLibrary(false);
            setTopPanel(null);
          } else {
            setShowComponentLibrary(true);
            if (showCommentsPanel) {
              setShowCommentsPanel(false);
            }
            setTopPanel('components');
          }
        }}
        showCommentsPanel={showCommentsPanel}
        onToggleCommentsPanel={() => {
          // Mutually exclusive panels
          if (showCommentsPanel) {
            setShowCommentsPanel(false);
            setTopPanel(null);
          } else {
            setShowCommentsPanel(true);
            if (showComponentLibrary) {
              setShowComponentLibrary(false);
            }
            setTopPanel('comments');
          }
        }}
      />

      {/* Component Library */}
      {showComponentLibrary && (
        <ComponentLibrary 
          onClose={() => {
            setShowComponentLibrary(false);
            setTopPanel(null);
          }}
          zIndex={topPanel === 'components' ? 50 : 40}
        />
      )}

      {/* Comments Panel */}
      {showCommentsPanel && (
        <CommentsPanel 
          onClose={() => {
            setShowCommentsPanel(false);
            setTopPanel(null);
          }}
          zIndex={topPanel === 'comments' ? 50 : 40}
        />
      )}

      {/* AI Input */}
      <AIInput />

      {/* Context Menu */}
      {contextMenu && (() => {
        const shape = shapes.find(s => s.id === contextMenu.shapeId);
        const isLockedByOther = shape?.isLocked && shape.lockedBy && shape.lockedBy !== currentUser?.uid;
        
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onBringForward={() => bringForward(contextMenu.shapeId)}
            onSendBackward={() => sendBack(contextMenu.shapeId)}
            onBringToFront={() => handleBringToFront(contextMenu.shapeId)}
            onSendToBack={() => handleSendToBack(contextMenu.shapeId)}
            onCopy={() => {
              copyShapes(selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId]);
              toast.success(`Copied ${selectedIds.length > 0 ? selectedIds.length : 1} shape${selectedIds.length > 1 ? 's' : ''}`);
            }}
            onCut={() => {
              const shapesToCut = selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId];
              cutShapes(shapesToCut).then(() => {
                toast.success(`Cut ${shapesToCut.length} shape${shapesToCut.length > 1 ? 's' : ''}`);
              }).catch(err => {
                console.error('Cut error:', err);
                toast.error('Failed to cut shapes');
              });
            }}
            onPaste={() => {
              pasteShapes().then(() => {
                toast.success('Pasted shapes');
              }).catch(err => {
                console.error('Paste error:', err);
                toast.error('Failed to paste shapes');
              });
            }}
            onDuplicate={() => duplicateShape(contextMenu.shapeId)}
            onDelete={() => deleteShape(contextMenu.shapeId)}
            onSelectAllOfType={() => {
              const shape = shapes.find(s => s.id === contextMenu.shapeId);
              if (shape) {
                selectShapesByType(shape.type);
                toast.success(`Selected all ${shape.type}s`);
              }
            }}
            shapeType={shapes.find(s => s.id === contextMenu.shapeId)?.type}
            isLockedByOther={!!isLockedByOther}
            hasClipboardData={hasClipboardData}
          />
        );
      })()}
    </div>
  );
};

export default Canvas;

