/**
 * @fileoverview Shapes state management with CRUD operations and Firestore sync
 * Handles shape operations, groups, history integration, and batching
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { doc, collection } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useCanvas } from '../../../hooks/useCanvas';
import { useHistory } from '../../../hooks/useHistory';
import { useClipboard } from '../../ClipboardContext';
import { 
  lockShape as lockShapeService, 
  unlockShape as unlockShapeService, 
  createShape as createShapeService, 
  alignShapes as alignShapesService, 
  distributeShapes as distributeShapesService,
  clearAllShapes as clearAllShapesService,
  restoreAllShapes as restoreAllShapesService,
  deleteMultipleShapes as deleteMultipleShapesService
} from '../../../services/canvas';
import {
  createGroup as createGroupService,
  ungroupShapes as ungroupShapesService,
  deleteGroupRecursive,
  updateGroupStyle as updateGroupStyleService,
  duplicateGroup as duplicateGroupService,
  getGroupShapesRecursive,
  updateGroupBounds as updateGroupBoundsService
} from '../../../services/grouping';
import { deleteShapeConnections } from '../../../services/connections';
import { serializeShapes, calculatePasteOffset, applyOffsetToShapes, isClipboardDataValid } from '../../../utils/clipboard';
import { exportCanvas as exportCanvasUtil } from '../../../utils/export';
import {
  createComponent as createComponentService,
  deleteComponent as deleteComponentService,
  updateComponent as updateComponentService,
  subscribeToComponents
} from '../../../services/components';
import {
  createComment as createCommentService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  resolveComment as resolveCommentService,
  unresolveComment as unresolveCommentService,
  subscribeToComments
} from '../../../services/comments';
import type { ShapeUpdateData, ShapeType, ShapeCreateData, Shape, Component, ComponentUpdateData, Comment, CommentUpdateData, ShapeGroup } from '../../../utils/types';
import type Konva from 'konva';
import { GLOBAL_CANVAS_ID, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';

export interface ShapesState {
  shapes: Shape[];
  groups: ShapeGroup[];
  components: Component[];
  comments: Comment[];
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasClipboardData: boolean;
}

export interface ShapesActions {
  // Shape CRUD
  addShape: (type: ShapeType, position: { x: number; y: number }, customProperties?: Partial<ShapeCreateData>) => Promise<string>;
  updateShape: (id: string, updates: ShapeUpdateData) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  deleteMultipleShapes: (ids: string[]) => Promise<void>;
  duplicateShape: (id: string) => Promise<void>;
  
  // Arrow key movement
  moveShapesByArrowKey: (shapeIds: string[], dx: number, dy: number) => void;
  saveArrowKeyMovementToHistory: (shapeIds: string[], totalDx: number, totalDy: number, originalPositions: Map<string, { x: number; y: number }>) => void;
  
  // Shape locking
  lockShape: (id: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  
  // Z-index
  bringForward: (id: string) => Promise<void>;
  sendBack: (id: string) => Promise<void>;
  
  // Alignment & distribution
  alignShapes: (alignType: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => Promise<void>;
  distributeShapes: (direction: 'horizontal' | 'vertical') => Promise<void>;
  
  // Groups
  groupShapes: (shapeIds: string[]) => Promise<string>;
  ungroupShapes: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroupStyle: (groupId: string, styleUpdates: Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>) => Promise<void>;
  updateGroupBounds: (groupId: string) => Promise<void>;
  duplicateGroup: (groupId: string) => Promise<string>;
  getGroupShapes: (groupId: string) => Shape[];
  
  // History
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  
  // Canvas operations
  clearAll: () => Promise<void>;
  
  // Clipboard
  copyShapes: (shapeIds: string[]) => void;
  cutShapes: (shapeIds: string[]) => Promise<void>;
  pasteShapes: (stageRef: React.RefObject<Konva.Stage | null>) => Promise<void>;
  
  // Export
  exportCanvas: (format: 'png' | 'svg', exportType: 'fullCanvas' | 'visibleArea' | 'selection', stageRef: React.RefObject<Konva.Stage | null>, selectedIds: string[]) => void;
  
  // Selection utilities
  selectShapesByType: (shapeType: string, onSelect: (ids: string[]) => void) => void;
  selectShapesInLasso: (lassoPolygon: Array<{ x: number; y: number }>, onSelect: (ids: string[]) => void) => void;
  
  // Components
  createComponent: (name: string, selectedIds: string[], description?: string) => Promise<string>;
  deleteComponent: (componentId: string) => Promise<void>;
  updateComponent: (componentId: string, updates: ComponentUpdateData) => Promise<void>;
  insertComponent: (componentId: string, stageRef: React.RefObject<Konva.Stage | null>, onSelect: (ids: string[]) => void, position?: { x: number; y: number }) => Promise<void>;
  
  // Comments
  createComment: (text: string, shapeId: string, position?: { x: number; y: number }, parentId?: string) => Promise<string>;
  updateComment: (commentId: string, updates: CommentUpdateData) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  unresolveComment: (commentId: string) => Promise<void>;
  getShapeComments: (shapeId: string) => Comment[];
  getShapeCommentCount: (shapeId: string) => number;
  getShapeUnresolvedCommentCount: (shapeId: string) => number;
}

export type UseShapesStateReturn = ShapesState & ShapesActions;

interface UseShapesStateProps {
  currentUserId: string | null;
  authLoading: boolean;
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectMultiple: (ids: string[]) => void;
}

/**
 * @description Manages shapes, groups, and all shape operations
 * Integrates with Firestore, history, and clipboard
 */
export const useShapesState = ({
  currentUserId,
  authLoading,
  selectedIds,
  onClearSelection,
  onSelectMultiple,
}: UseShapesStateProps): UseShapesStateReturn => {
  // History for undo/redo
  const history = useHistory();
  const isPerformingHistoryAction = useRef(false);
  
  // Clipboard
  const { clipboardData, setClipboardData, incrementPasteCount, resetPasteCount } = useClipboard();
  
  // Use the canvas hook for real-time synchronization
  const {
    shapes,
    groups,
    connections: _connections,
    loading,
    addShape: addShapeHook,
    updateShape: updateShapeHook,
    deleteShape: deleteShapeHook,
  } = useCanvas(currentUserId || 'anonymous', !authLoading);
  
  // Components state
  const [components, setComponents] = useState<Component[]>([]);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Track previous shapes to detect additions for history recording
  const prevShapesRef = useRef<string[]>([]);
  
  // Detect new shapes and record them in history
  useEffect(() => {
    if (isPerformingHistoryAction.current || !currentUserId) return;
    
    const currentShapeIds = shapes.map(s => s.id);
    const prevShapeIds = prevShapesRef.current;
    
    // Find new shapes (in current but not in previous)
    const newShapeIds = currentShapeIds.filter(id => !prevShapeIds.includes(id));
    
    // Record new shapes to history
    newShapeIds.forEach(shapeId => {
      const newShape = shapes.find(s => s.id === shapeId);
      if (newShape && newShape.createdBy === currentUserId) {
        history.recordAction({
          type: 'create',
          shapesAffected: [shapeId],
          before: {},
          after: { [shapeId]: { ...newShape } },
          timestamp: Date.now(),
          userId: currentUserId,
        });
      }
    });
    
    // Update ref
    prevShapesRef.current = currentShapeIds;
  }, [shapes, currentUserId, history]);
  
  // Subscribe to components
  useEffect(() => {
    if (!authLoading) {
      const unsubscribe = subscribeToComponents(GLOBAL_CANVAS_ID, setComponents);
      return () => unsubscribe();
    }
  }, [authLoading]);
  
  // Subscribe to comments
  useEffect(() => {
    if (!authLoading) {
      const unsubscribe = subscribeToComments(GLOBAL_CANVAS_ID, setComments);
      return () => unsubscribe();
    }
  }, [authLoading]);

  /**
   * Add a new shape to the canvas
   */
  const addShape = useCallback(async (
    type: ShapeType,
    position: { x: number; y: number },
    customProperties?: Partial<ShapeCreateData>
  ): Promise<string> => {
    const shapeId = await addShapeHook(type, position, customProperties);
    return shapeId;
  }, [addShapeHook]);

  /**
   * Update an existing shape
   */
  const updateShape = useCallback(async (id: string, updates: ShapeUpdateData): Promise<void> => {
    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current || !currentUserId) {
      await updateShapeHook(id, updates);
      return;
    }
    
    // Find the shape to get its current state
    const shape = shapes.find(s => s.id === id);
    if (!shape) {
      await updateShapeHook(id, updates);
      return;
    }
    
    // Record only the fields that are changing
    const beforeState: Partial<typeof shape> = {};
    const afterState: Partial<typeof shape> = {};
    
    Object.keys(updates).forEach(key => {
      const shapeKey = key as keyof typeof shape;
      beforeState[shapeKey] = shape[shapeKey] as any;
      afterState[shapeKey] = updates[key as keyof ShapeUpdateData] as any;
    });
    
    // Record the action before making the change
    history.recordAction({
      type: 'update',
      shapesAffected: [id],
      before: { [id]: beforeState },
      after: { [id]: afterState },
      timestamp: Date.now(),
      userId: currentUserId,
    });
    
    await updateShapeHook(id, updates);
  }, [currentUserId, shapes, updateShapeHook, history]);

  /**
   * Move shapes by arrow keys (1px precision)
   */
  const moveShapesByArrowKey = useCallback((shapeIds: string[], dx: number, dy: number) => {
    // First, check if the movement would cause any shape to go out of bounds
    let canMove = true;
    const newPositions = new Map<string, { x: number; y: number }>();
    
    shapeIds.forEach(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) return;
      
      let newX = shape.x + dx;
      let newY = shape.y + dy;
      
      // Calculate bounds based on shape type
      if (shape.type === 'circle' && shape.radius) {
        // For circles, x,y is the center, so check radius
        const minX = shape.radius;
        const maxX = CANVAS_WIDTH - shape.radius;
        const minY = shape.radius;
        const maxY = CANVAS_HEIGHT - shape.radius;
        
        if (newX < minX || newX > maxX || newY < minY || newY > maxY) {
          canMove = false;
          return;
        }
      } else {
        // For rectangles and other shapes, x,y is top-left
        const width = shape.width || 100;
        const height = shape.height || 100;
        
        if (newX < 0 || newX + width > CANVAS_WIDTH || newY < 0 || newY + height > CANVAS_HEIGHT) {
          canMove = false;
          return;
        }
      }
      
      newPositions.set(shapeId, { x: newX, y: newY });
    });
    
    // Only move if ALL shapes can move without going out of bounds
    if (canMove) {
      newPositions.forEach((pos, shapeId) => {
        updateShapeHook(shapeId, { x: pos.x, y: pos.y });
      });
    }
  }, [shapes, updateShapeHook]);

  /**
   * Save batched arrow key movements to history
   */
  const saveArrowKeyMovementToHistory = useCallback((
    shapeIds: string[], 
    totalDx: number, 
    totalDy: number,
    originalPositions: Map<string, { x: number; y: number }>
  ) => {
    if (!currentUserId || (totalDx === 0 && totalDy === 0)) return;
    
    // Build before and after states
    const before: Record<string, Partial<Shape>> = {};
    const after: Record<string, Partial<Shape>> = {};
    
    shapeIds.forEach(id => {
      const orig = originalPositions.get(id);
      const shape = shapes.find(s => s.id === id);
      
      if (orig && shape) {
        before[id] = { x: orig.x, y: orig.y };
        after[id] = { x: shape.x, y: shape.y };
      }
    });
    
    // Record as a single history action
    history.recordAction({
      type: 'update',
      shapesAffected: shapeIds,
      before,
      after,
      timestamp: Date.now(),
      userId: currentUserId,
    });
  }, [currentUserId, shapes, history]);

  /**
   * Delete a shape from the canvas
   */
  const deleteShape = useCallback(async (id: string): Promise<void> => {
    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current || !currentUserId) {
      await deleteShapeHook(id);
      if (selectedIds.includes(id)) {
        onClearSelection();
      }
      return;
    }
    
    // Find the shape to record its state before deletion
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      history.recordAction({
        type: 'delete',
        shapesAffected: [id],
        before: { [id]: { ...shape } },
        after: {},
        timestamp: Date.now(),
        userId: currentUserId,
      });
    }
    
    await deleteShapeHook(id);
    
    // Also delete any connections involving this shape
    try {
      await deleteShapeConnections(GLOBAL_CANVAS_ID, id);
    } catch (error) {
      console.error('Error deleting shape connections:', error);
    }
    
    // Clear selection if deleted shape was selected
    if (selectedIds.includes(id)) {
      onClearSelection();
    }
  }, [currentUserId, shapes, deleteShapeHook, history, selectedIds, onClearSelection]);

  /**
   * Delete multiple shapes in a single atomic operation
   */
  const deleteMultipleShapes = useCallback(async (ids: string[]): Promise<void> => {
    if (!currentUserId || ids.length === 0) return;
    
    // Record history for all shapes
    const shapesToDelete = shapes.filter(s => ids.includes(s.id));
    const before: Record<string, Shape> = {};
    shapesToDelete.forEach(shape => {
      before[shape.id] = { ...shape };
    });
    
    if (shapesToDelete.length > 0) {
      history.recordAction({
        type: 'delete',
        shapesAffected: ids,
        before,
        after: {},
        timestamp: Date.now(),
        userId: currentUserId,
      });
    }
    
    // Delete all shapes in a single Firestore operation
    await deleteMultipleShapesService(GLOBAL_CANVAS_ID, ids);
    
    // Delete connections for all shapes
    try {
      for (const id of ids) {
        await deleteShapeConnections(GLOBAL_CANVAS_ID, id);
      }
    } catch (error) {
      console.error('Error deleting shape connections:', error);
    }
    
    // Clear selection
    onClearSelection();
  }, [currentUserId, shapes, history, onClearSelection]);

  /**
   * Lock a shape for exclusive editing
   */
  const lockShape = useCallback(async (id: string): Promise<void> => {
    if (!currentUserId) return;
    try {
      await lockShapeService(GLOBAL_CANVAS_ID, id, currentUserId);
    } catch (err) {
      console.error('Error locking shape:', err);
    }
  }, [currentUserId]);

  /**
   * Unlock a shape
   */
  const unlockShape = useCallback(async (id: string): Promise<void> => {
    try {
      await unlockShapeService(GLOBAL_CANVAS_ID, id);
    } catch (err) {
      console.error('Error unlocking shape:', err);
    }
  }, []);

  /**
   * Duplicate a shape with 20px offset
   */
  const duplicateShape = useCallback(async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUserId) return;
    
    // Check if shape is locked by another user
    if (shape.isLocked && shape.lockedBy !== currentUserId) {
      console.error('Cannot duplicate locked shape');
      return;
    }
    
    // Generate new ID for the duplicated shape
    const newId = doc(collection(db, 'canvases')).id;
    
    // Create a copy with 20px offset, excluding metadata fields
    const { id: _id, createdAt, createdBy, lastModifiedAt, lastModifiedBy, isLocked, lockedBy, lockedAt, ...shapeData } = shape;
    
    const duplicatedShape: ShapeCreateData = {
      ...shapeData,
      id: newId,
      type: shape.type,
      x: shape.x + 20,
      y: shape.y + 20,
      createdBy: currentUserId,
    };
    
    await createShapeService(GLOBAL_CANVAS_ID, duplicatedShape);
    
    // Select the duplicated shape after creation
    setTimeout(() => {
      onSelectMultiple([newId]);
    }, 100);
    
    // Record the creation in history (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      setTimeout(() => {
        const createdShape = shapes.find(s => s.id === newId);
        if (createdShape) {
          history.recordAction({
            type: 'create',
            shapesAffected: [newId],
            before: {},
            after: { [newId]: { ...createdShape } },
            timestamp: Date.now(),
            userId: currentUserId,
          });
        }
      }, 200);
    }
  }, [shapes, currentUserId, history, onSelectMultiple]);

  /**
   * Bring a shape forward (increase zIndex)
   */
  const bringForward = useCallback(async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUserId) return;
    
    const currentZIndex = shape.zIndex || 0;
    const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0));
    
    // Only increase if not already at top
    if (currentZIndex < maxZIndex) {
      const newZIndex = currentZIndex + 1;
      
      // Record the action (skip if in undo/redo)
      if (!isPerformingHistoryAction.current) {
        history.recordAction({
          type: 'update',
          shapesAffected: [id],
          before: { [id]: { zIndex: currentZIndex } },
          after: { [id]: { zIndex: newZIndex } },
          timestamp: Date.now(),
          userId: currentUserId,
        });
      }
      
      await updateShapeHook(id, { zIndex: newZIndex });
    }
  }, [shapes, currentUserId, updateShapeHook, history]);

  /**
   * Send a shape back (decrease zIndex)
   */
  const sendBack = useCallback(async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUserId) return;
    
    const currentZIndex = shape.zIndex || 0;
    const minZIndex = Math.min(...shapes.map(s => s.zIndex || 0));
    
    // Only decrease if not already at bottom
    if (currentZIndex > minZIndex) {
      const newZIndex = currentZIndex - 1;
      
      // Record the action (skip if in undo/redo)
      if (!isPerformingHistoryAction.current) {
        history.recordAction({
          type: 'update',
          shapesAffected: [id],
          before: { [id]: { zIndex: currentZIndex } },
          after: { [id]: { zIndex: newZIndex } },
          timestamp: Date.now(),
          userId: currentUserId,
        });
      }
      
      await updateShapeHook(id, { zIndex: newZIndex });
    }
  }, [shapes, currentUserId, updateShapeHook, history]);

  /**
   * Align selected shapes
   */
  const alignShapes = useCallback(async (alignType: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom'): Promise<void> => {
    if (selectedIds.length < 2 || !currentUserId) return;
    
    // Record before states (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      const before: Record<string, Partial<typeof shapes[0]>> = {};
      selectedIds.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          before[id] = { x: shape.x, y: shape.y };
        }
      });
      
      // Perform alignment
      await alignShapesService(GLOBAL_CANVAS_ID, selectedIds, alignType, shapes);
      
      // Wait for Firestore sync and record after states
      setTimeout(() => {
        const after: Record<string, Partial<typeof shapes[0]>> = {};
        selectedIds.forEach(id => {
          const shape = shapes.find(s => s.id === id);
          if (shape) {
            after[id] = { x: shape.x, y: shape.y };
          }
        });
        
        history.recordAction({
          type: 'update',
          shapesAffected: selectedIds,
          before,
          after,
          timestamp: Date.now(),
          userId: currentUserId,
        });
      }, 200);
    } else {
      await alignShapesService(GLOBAL_CANVAS_ID, selectedIds, alignType, shapes);
    }
  }, [selectedIds, currentUserId, shapes, history]);

  /**
   * Distribute selected shapes evenly
   */
  const distributeShapes = useCallback(async (direction: 'horizontal' | 'vertical'): Promise<void> => {
    if (selectedIds.length < 3 || !currentUserId) return;
    
    // Record before states (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      const before: Record<string, Partial<typeof shapes[0]>> = {};
      selectedIds.forEach(id => {
        const shape = shapes.find(s => s.id === id);
        if (shape) {
          before[id] = { x: shape.x, y: shape.y };
        }
      });
      
      // Perform distribution
      await distributeShapesService(GLOBAL_CANVAS_ID, selectedIds, direction, shapes);
      
      // Wait for Firestore sync and record after states
      setTimeout(() => {
        const after: Record<string, Partial<typeof shapes[0]>> = {};
        selectedIds.forEach(id => {
          const shape = shapes.find(s => s.id === id);
          if (shape) {
            after[id] = { x: shape.x, y: shape.y };
          }
        });
        
        history.recordAction({
          type: 'update',
          shapesAffected: selectedIds,
          before,
          after,
          timestamp: Date.now(),
          userId: currentUserId,
        });
      }, 200);
    } else {
      await distributeShapesService(GLOBAL_CANVAS_ID, selectedIds, direction, shapes);
    }
  }, [selectedIds, currentUserId, shapes, history]);

  /**
   * Group selected shapes together
   */
  const groupShapes = useCallback(async (shapeIds: string[]): Promise<string> => {
    if (shapeIds.length < 2 || !currentUserId) {
      throw new Error('Need at least 2 shapes to create a group');
    }

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      const group = await createGroupService(GLOBAL_CANVAS_ID, shapeIds, currentUserId, shapes);
      return group.id;
    }

    // Record before states
    const before: Record<string, Partial<Shape>> = {};
    shapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        before[id] = { groupId: shape.groupId };
      }
    });

    // Create the group
    const group = await createGroupService(GLOBAL_CANVAS_ID, shapeIds, currentUserId, shapes);

    // Wait for Firestore sync
    setTimeout(() => {
      const after: Record<string, Partial<Shape>> = {};
      shapeIds.forEach(id => {
        after[id] = { groupId: group.id };
      });

      history.recordAction({
        type: 'update',
        shapesAffected: shapeIds,
        before,
        after,
        timestamp: Date.now(),
        userId: currentUserId,
      });
    }, 200);

    return group.id;
  }, [currentUserId, shapes, history]);

  /**
   * Ungroup shapes (remove group but keep shapes)
   */
  const ungroupShapes = useCallback(async (groupId: string): Promise<void> => {
    if (!currentUserId) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      await ungroupShapesService(GLOBAL_CANVAS_ID, groupId);
      return;
    }

    // Record before states
    const before: Record<string, Partial<Shape>> = {};
    group.shapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        before[id] = { groupId: shape.groupId };
      }
    });

    // Ungroup
    await ungroupShapesService(GLOBAL_CANVAS_ID, groupId);

    // Wait for Firestore sync
    setTimeout(() => {
      const after: Record<string, Partial<Shape>> = {};
      group.shapeIds.forEach(id => {
        after[id] = { groupId: undefined };
      });

      history.recordAction({
        type: 'update',
        shapesAffected: group.shapeIds,
        before,
        after,
        timestamp: Date.now(),
        userId: currentUserId,
      });
    }, 200);
  }, [currentUserId, groups, shapes, history]);

  /**
   * Delete a group and all shapes within it (recursive)
   */
  const deleteGroup = useCallback(async (groupId: string): Promise<void> => {
    if (!currentUserId) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get all shapes that will be deleted (recursive)
    const shapeIds = getGroupShapesRecursive(groupId, shapes, groups);

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      await deleteGroupRecursive(GLOBAL_CANVAS_ID, groupId, shapes, groups);
      if (selectedIds.some(id => shapeIds.includes(id))) {
        onClearSelection();
      }
      return;
    }

    // Record before states
    const before: Record<string, Partial<Shape>> = {};
    shapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        before[id] = { ...shape };
      }
    });

    // Delete the group and all children
    await deleteGroupRecursive(GLOBAL_CANVAS_ID, groupId, shapes, groups);

    // Clear selection if any deleted shapes were selected
    if (selectedIds.some(id => shapeIds.includes(id))) {
      onClearSelection();
    }

    // Record action
    history.recordAction({
      type: 'delete',
      shapesAffected: shapeIds,
      before,
      after: {},
      timestamp: Date.now(),
      userId: currentUserId,
    });
  }, [currentUserId, groups, shapes, history, selectedIds, onClearSelection]);

  /**
   * Update style for all shapes in a group
   */
  const updateGroupStyle = useCallback(async (
    groupId: string,
    styleUpdates: Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>
  ): Promise<void> => {
    if (!currentUserId) return;

    // Get all shape IDs in group (recursive)
    const shapeIds = getGroupShapesRecursive(groupId, shapes, groups);

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      await updateGroupStyleService(GLOBAL_CANVAS_ID, groupId, styleUpdates, shapes, groups);
      return;
    }

    // Record before states
    const before: Record<string, Partial<Shape>> = {};
    shapeIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        const beforeState: Partial<Shape> = {};
        Object.keys(styleUpdates).forEach(key => {
          const shapeKey = key as keyof typeof shape;
          beforeState[shapeKey] = shape[shapeKey] as any;
        });
        before[id] = beforeState;
      }
    });

    // Apply style updates
    await updateGroupStyleService(GLOBAL_CANVAS_ID, groupId, styleUpdates, shapes, groups);

    // Wait for Firestore sync
    setTimeout(() => {
      const after: Record<string, Partial<Shape>> = {};
      shapeIds.forEach(id => {
        after[id] = { ...styleUpdates };
      });

      history.recordAction({
        type: 'update',
        shapesAffected: shapeIds,
        before,
        after,
        timestamp: Date.now(),
        userId: currentUserId,
      });
    }, 200);
  }, [currentUserId, shapes, groups, history]);

  /**
   * Update group bounding box after shapes have moved
   */
  const updateGroupBounds = useCallback(async (groupId: string): Promise<void> => {
    await updateGroupBoundsService(GLOBAL_CANVAS_ID, groupId, shapes);
  }, [shapes]);

  /**
   * Duplicate a group and all its shapes
   */
  const duplicateGroup = useCallback(async (groupId: string): Promise<string> => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    // Duplicate the group
    const newGroupId = await duplicateGroupService(GLOBAL_CANVAS_ID, groupId, currentUserId, shapes, groups);

    // Record action (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      setTimeout(() => {
        const newGroup = groups.find(g => g.id === newGroupId);
        if (newGroup) {
          const newShapeIds = getGroupShapesRecursive(newGroupId, shapes, groups);
          const after: Record<string, Partial<Shape>> = {};
          
          newShapeIds.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
              after[id] = { ...shape };
            }
          });

          history.recordAction({
            type: 'create',
            shapesAffected: newShapeIds,
            before: {},
            after,
            timestamp: Date.now(),
            userId: currentUserId,
          });
        }
      }, 400);
    }

    return newGroupId;
  }, [currentUserId, shapes, groups, history]);

  /**
   * Get all shapes in a group (recursive)
   */
  const getGroupShapes = useCallback((groupId: string): Shape[] => {
    const shapeIds = getGroupShapesRecursive(groupId, shapes, groups);
    return shapes.filter(s => shapeIds.includes(s.id));
  }, [shapes, groups]);

  /**
   * Undo the last action
   */
  const undo = useCallback(async (): Promise<void> => {
    const action = history.undo();
    if (!action || !currentUserId) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Check if this is a bulk operation (has group data)
      if (action.groupsBefore !== undefined && action.groupsAfter !== undefined) {
        // Bulk operation - use atomic restore
        const shapesArray = Object.values(action.before).map(s => s as Shape);
        await restoreAllShapesService(GLOBAL_CANVAS_ID, shapesArray, action.groupsBefore);
      } else {
        // Individual shape operations
        for (const id of action.shapesAffected) {
          const beforeState = action.before[id];
          const afterState = action.after[id];
          
          // Check if this is a connection (marked with type: 'connection')
          const isConnection = (afterState as any)?.type === 'connection' || (beforeState as any)?.type === 'connection';
          
          if (!isConnection) {
            // Handle shape undo
            if (action.type === 'create') {
              // Undo create: delete the shape
              await deleteShapeHook(id);
            } else if (action.type === 'delete') {
              // Undo delete: recreate the shape
              if (beforeState) {
                await createShapeService(GLOBAL_CANVAS_ID, beforeState as ShapeCreateData);
              }
            } else {
              // Undo update: restore previous values
              if (beforeState) {
                await updateShapeHook(id, beforeState);
              }
            }
          }
        }
      }
    } finally {
      // Clear flag after a short delay to ensure all updates complete
      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 300);
    }
  }, [currentUserId, history, deleteShapeHook, updateShapeHook]);

  /**
   * Redo the next action
   */
  const redo = useCallback(async (): Promise<void> => {
    const action = history.redo();
    if (!action || !currentUserId) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Check if this is a bulk operation (has group data)
      if (action.groupsBefore !== undefined && action.groupsAfter !== undefined) {
        // Bulk operation - use atomic restore
        const shapesArray = Object.values(action.after).map(s => s as Shape);
        await restoreAllShapesService(GLOBAL_CANVAS_ID, shapesArray, action.groupsAfter);
      } else {
        // Individual shape operations
        for (const id of action.shapesAffected) {
          const beforeState = action.before[id];
          const afterState = action.after[id];
          
          // Check if this is a connection (marked with type: 'connection')
          const isConnection = (afterState as any)?.type === 'connection' || (beforeState as any)?.type === 'connection';
          
          if (!isConnection) {
            // Handle shape redo
            if (action.type === 'create') {
              // Redo create: recreate the shape
              if (afterState) {
                await createShapeService(GLOBAL_CANVAS_ID, afterState as ShapeCreateData);
              }
            } else if (action.type === 'delete') {
              // Redo delete: delete the shape again
              await deleteShapeHook(id);
            } else {
              // Redo update: apply the new values
              if (afterState) {
                await updateShapeHook(id, afterState);
              }
            }
          }
        }
      }
    } finally {
      // Clear flag after a short delay to ensure all updates complete
      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 300);
    }
  }, [currentUserId, history, deleteShapeHook, updateShapeHook]);

  /**
   * Clear all shapes, groups, and connections from the canvas
   */
  const clearAll = useCallback(async (): Promise<void> => {
    if (!currentUserId) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to clear everything from the canvas? This will affect all users.'
    );

    if (!confirmed) return;

    // Capture current state before deletion
    const shapesToDelete = [...shapes];
    const groupsToDelete = [...groups];
    const allShapeIds = shapesToDelete.map(s => s.id);

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      await clearAllShapesService(GLOBAL_CANVAS_ID);
      onClearSelection();
      return;
    }

    // Capture current state of all shapes for history
    const before: Record<string, Partial<Shape>> = {};
    shapesToDelete.forEach(shape => {
      before[shape.id] = { ...shape };
    });

    // Single atomic operation to clear everything from Firestore
    await clearAllShapesService(GLOBAL_CANVAS_ID);

    // Clear all selections
    onClearSelection();

    // Record as single delete action with groups information
    history.recordAction({
      type: 'delete',
      shapesAffected: allShapeIds,
      before,
      after: {},
      groupsBefore: groupsToDelete,
      groupsAfter: [],
      timestamp: Date.now(),
      userId: currentUserId,
    });
  }, [currentUserId, shapes, groups, history, onClearSelection]);

  /**
   * Copy selected shapes to clipboard
   */
  const copyShapes = useCallback((shapeIds: string[]): void => {
    if (shapeIds.length === 0) return;
    
    const shapesToCopy = shapes.filter(s => shapeIds.includes(s.id));
    if (shapesToCopy.length === 0) return;
    
    // Serialize shapes (removes metadata)
    const serialized = serializeShapes(shapesToCopy);
    
    // Store in clipboard
    setClipboardData({
      shapes: serialized as Shape[],
      timestamp: Date.now(),
      pasteCount: 0,
    });
    
    // Reset paste count when copying new shapes
    resetPasteCount();
  }, [shapes, setClipboardData, resetPasteCount]);

  /**
   * Cut selected shapes (copy + delete)
   */
  const cutShapes = useCallback(async (shapeIds: string[]): Promise<void> => {
    if (shapeIds.length === 0) return;
    
    // Check if any shapes are locked by another user
    const lockedShapes = shapes.filter(
      s => shapeIds.includes(s.id) && s.isLocked && s.lockedBy !== currentUserId
    );
    
    if (lockedShapes.length > 0) {
      console.warn('Cannot cut locked shapes');
      return;
    }
    
    // First copy to clipboard
    copyShapes(shapeIds);
    
    // Then delete the shapes
    await deleteMultipleShapes(shapeIds);
  }, [shapes, currentUserId, copyShapes, deleteMultipleShapes]);

  /**
   * Paste shapes from clipboard
   */
  const pasteShapes = useCallback(async (stageRef: React.RefObject<Konva.Stage | null>): Promise<void> => {
    if (!clipboardData || !isClipboardDataValid(clipboardData) || !currentUserId) {
      return;
    }
    
    const stage = stageRef?.current;
    if (!stage) {
      console.error('Cannot paste: stage ref not available');
      return;
    }
    
    // Calculate viewport center in canvas coordinates
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const stageX = stage.x();
    const stageY = stage.y();
    const scale = stage.scaleX();
    
    const viewportCenterCanvasX = (-stageX + stageWidth / 2) / scale;
    const viewportCenterCanvasY = (-stageY + stageHeight / 2) / scale;
    
    // Calculate the center of the original shapes
    const originalShapes = clipboardData.shapes;
    if (originalShapes.length === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    originalShapes.forEach(shape => {
      const width = shape.width || 100;
      const height = shape.height || 100;
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + width);
      maxY = Math.max(maxY, shape.y + height);
    });
    
    const originalCenterX = (minX + maxX) / 2;
    const originalCenterY = (minY + maxY) / 2;
    
    // Calculate offset
    const incrementalOffset = calculatePasteOffset(clipboardData.pasteCount);
    const offsetX = viewportCenterCanvasX - originalCenterX + incrementalOffset.x;
    const offsetY = viewportCenterCanvasY - originalCenterY + incrementalOffset.y;
    
    // Apply offset to shapes
    const offsetShapes = applyOffsetToShapes(clipboardData.shapes as any, { x: offsetX, y: offsetY });
    
    // Create new shapes
    const newShapeIds: string[] = [];
    
    for (const shapeData of offsetShapes) {
      const newId = doc(collection(db, 'canvases')).id;
      
      const newShape: ShapeCreateData = {
        ...shapeData,
        id: newId,
        createdBy: currentUserId,
      };
      
      await createShapeService(GLOBAL_CANVAS_ID, newShape);
      newShapeIds.push(newId);
    }
    
    // Increment paste count for next paste
    incrementPasteCount();
    
    // Select the newly pasted shapes
    setTimeout(() => {
      onSelectMultiple(newShapeIds);
    }, 100);
    
    // Record the creation in history
    if (!isPerformingHistoryAction.current) {
      setTimeout(() => {
        const createdShapes = shapes.filter(s => newShapeIds.includes(s.id));
        if (createdShapes.length > 0) {
          const after: Record<string, Partial<Shape>> = {};
          createdShapes.forEach(shape => {
            after[shape.id] = { ...shape };
          });
          
          history.recordAction({
            type: 'create',
            shapesAffected: newShapeIds,
            before: {},
            after,
            timestamp: Date.now(),
            userId: currentUserId,
          });
        }
      }, 200);
    }
  }, [clipboardData, currentUserId, shapes, incrementPasteCount, onSelectMultiple, history]);

  /**
   * Export canvas as PNG or SVG
   */
  const exportCanvas = useCallback((
    format: 'png' | 'svg',
    exportType: 'fullCanvas' | 'visibleArea' | 'selection',
    stageRef: React.RefObject<Konva.Stage | null>,
    selectedIds: string[]
  ): void => {
    const stage = stageRef?.current;
    
    if (!stage) {
      console.error('Cannot export: stage ref not available');
      return;
    }
    
    try {
      if (exportType === 'selection' && selectedIds.length === 0) {
        console.warn('No shapes selected for export');
        return;
      }
      
      exportCanvasUtil(stage, {
        format,
        exportType,
        quality: 1,
        scale: 2,
        selectedShapeIds: exportType === 'selection' ? selectedIds : undefined,
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  }, []);

  /**
   * Select all shapes of a specific type
   */
  const selectShapesByType = useCallback((shapeType: string, onSelect: (ids: string[]) => void): void => {
    const shapeIds = shapes
      .filter(shape => shape.type === shapeType)
      .map(shape => shape.id);
    onSelect(shapeIds);
  }, [shapes]);

  /**
   * Select all shapes within a lasso polygon
   */
  const selectShapesInLasso = useCallback((lassoPolygon: Array<{ x: number; y: number }>, onSelect: (ids: string[]) => void): void => {
    // Dynamically import selection utilities to avoid circular dependencies
    import('../../../utils/selection').then(({ getShapesInLasso }) => {
      const shapeIds = getShapesInLasso(shapes, lassoPolygon);
      onSelect(shapeIds);
    });
  }, [shapes]);

  /**
   * Create a component from selected shapes
   */
  const createComponent = useCallback(async (name: string, selectedIds: string[], description?: string): Promise<string> => {
    if (!currentUserId || selectedIds.length === 0) {
      throw new Error('No shapes selected or user not authenticated');
    }

    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    if (selectedShapes.length === 0) {
      throw new Error('Selected shapes not found');
    }

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedShapes.forEach(shape => {
      if (shape.type === 'circle' && shape.radius) {
        minX = Math.min(minX, shape.x - shape.radius);
        minY = Math.min(minY, shape.y - shape.radius);
        maxX = Math.max(maxX, shape.x + shape.radius);
        maxY = Math.max(maxY, shape.y + shape.radius);
      } else {
        const width = shape.width || 100;
        const height = shape.height || 100;
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + width);
        maxY = Math.max(maxY, shape.y + height);
      }
    });

    const width = maxX - minX;
    const height = maxY - minY;

    // Serialize shapes relative to the bounding box origin
    const serializedShapes = serializeShapes(selectedShapes).map(shape => ({
      ...shape,
      x: shape.x - minX,
      y: shape.y - minY,
    }));

    // Create component
    const componentId = await createComponentService({
      name,
      description,
      shapes: serializedShapes as any,
      width,
      height,
      createdBy: currentUserId,
      canvasId: GLOBAL_CANVAS_ID,
    });

    return componentId;
  }, [currentUserId, shapes]);

  /**
   * Delete a component
   */
  const deleteComponent = useCallback(async (componentId: string): Promise<void> => {
    await deleteComponentService(componentId);
  }, []);

  /**
   * Update a component
   */
  const updateComponent = useCallback(async (componentId: string, updates: ComponentUpdateData): Promise<void> => {
    if (!currentUserId) return;
    await updateComponentService(componentId, {
      ...updates,
      lastModifiedBy: currentUserId,
    });
  }, [currentUserId]);

  /**
   * Insert a component instance at viewport center
   */
  const insertComponent = useCallback(async (
    componentId: string,
    stageRef: React.RefObject<Konva.Stage | null>,
    onSelect: (ids: string[]) => void,
    position?: { x: number; y: number }
  ): Promise<void> => {
    if (!currentUserId) return;

    const component = components.find(c => c.id === componentId);
    if (!component) {
      throw new Error('Component not found');
    }

    const stage = stageRef?.current;
    if (!stage) {
      console.error('Cannot insert component: stage ref not available');
      return;
    }

    // Calculate viewport center in canvas coordinates (unless position explicitly provided)
    let insertX: number, insertY: number;
    
    if (position) {
      insertX = position.x;
      insertY = position.y;
    } else {
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      const stageX = stage.x();
      const stageY = stage.y();
      const scale = stage.scaleX();

      const viewportCenterCanvasX = (-stageX + stageWidth / 2) / scale;
      const viewportCenterCanvasY = (-stageY + stageHeight / 2) / scale;

      insertX = viewportCenterCanvasX - component.width / 2;
      insertY = viewportCenterCanvasY - component.height / 2;
    }

    // Create shapes from component template
    const newShapeIds: string[] = [];
    for (const shapeTemplate of component.shapes) {
      const newId = doc(collection(db, 'canvases')).id;
      
      const newShape: ShapeCreateData = {
        ...shapeTemplate,
        id: newId,
        x: insertX + shapeTemplate.x,
        y: insertY + shapeTemplate.y,
        createdBy: currentUserId,
      };

      await createShapeService(GLOBAL_CANVAS_ID, newShape);
      newShapeIds.push(newId);
    }

    // Select the newly created shapes
    setTimeout(() => {
      onSelect(newShapeIds);
    }, 100);
  }, [currentUserId, components]);

  /**
   * Create a comment on a shape
   */
  const createComment = useCallback(async (
    text: string,
    shapeId: string,
    position?: { x: number; y: number },
    parentId?: string
  ): Promise<string> => {
    if (!currentUserId) {
      throw new Error('User not authenticated');
    }

    const commentId = await createCommentService({
      text,
      shapeId,
      canvasId: GLOBAL_CANVAS_ID,
      createdBy: currentUserId,
      createdByName: 'User', // This should come from auth context
      x: position?.x,
      y: position?.y,
      parentId,
    });

    return commentId;
  }, [currentUserId]);

  /**
   * Update a comment
   */
  const updateComment = useCallback(async (commentId: string, updates: CommentUpdateData): Promise<void> => {
    await updateCommentService(commentId, updates);
  }, []);

  /**
   * Delete a comment
   */
  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    await deleteCommentService(commentId);
  }, []);

  /**
   * Resolve a comment
   */
  const resolveComment = useCallback(async (commentId: string): Promise<void> => {
    if (!currentUserId) return;
    await resolveCommentService(commentId, currentUserId);
  }, [currentUserId]);

  /**
   * Unresolve a comment
   */
  const unresolveComment = useCallback(async (commentId: string): Promise<void> => {
    await unresolveCommentService(commentId);
  }, []);

  /**
   * Get all comments for a specific shape
   */
  const getShapeComments = useCallback((shapeId: string): Comment[] => {
    return comments.filter(comment => comment.shapeId === shapeId);
  }, [comments]);

  /**
   * Get total comment count for a shape (including resolved)
   */
  const getShapeCommentCount = useCallback((shapeId: string): number => {
    return comments.filter(comment => comment.shapeId === shapeId).length;
  }, [comments]);

  /**
   * Get unresolved comment count for a shape
   */
  const getShapeUnresolvedCommentCount = useCallback((shapeId: string): number => {
    return comments.filter(comment => comment.shapeId === shapeId && !comment.resolved).length;
  }, [comments]);

  return {
    shapes,
    groups,
    components,
    comments,
    loading,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    hasClipboardData: isClipboardDataValid(clipboardData),
    addShape,
    updateShape,
    deleteShape,
    deleteMultipleShapes,
    duplicateShape,
    moveShapesByArrowKey,
    saveArrowKeyMovementToHistory,
    lockShape,
    unlockShape,
    bringForward,
    sendBack,
    alignShapes,
    distributeShapes,
    groupShapes,
    ungroupShapes,
    deleteGroup,
    updateGroupStyle,
    updateGroupBounds,
    duplicateGroup,
    getGroupShapes,
    undo,
    redo,
    clearAll,
    copyShapes,
    cutShapes,
    pasteShapes,
    exportCanvas,
    selectShapesByType,
    selectShapesInLasso,
    createComponent,
    deleteComponent,
    updateComponent,
    insertComponent,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    getShapeComments,
    getShapeCommentCount,
    getShapeUnresolvedCommentCount,
  };
};

