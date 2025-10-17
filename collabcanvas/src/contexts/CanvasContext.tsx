import React, { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import { useHistory } from '../hooks/useHistory';
import { useClipboard } from './ClipboardContext';
import { lockShape as lockShapeService, unlockShape as unlockShapeService, createShape as createShapeService, alignShapes as alignShapesService, distributeShapes as distributeShapesService, clearAllShapes as clearAllShapesService, restoreAllShapes as restoreAllShapesService, deleteMultipleShapes as deleteMultipleShapesService } from '../services/canvas';
import { 
  createGroup as createGroupService, 
  ungroupShapes as ungroupShapesService, 
  deleteGroupRecursive, 
  updateGroupStyle as updateGroupStyleService,
  duplicateGroup as duplicateGroupService,
  getGroupShapesRecursive,
  updateGroupBounds as updateGroupBoundsService
} from '../services/grouping';
import {
  addConnection as addConnectionService,
  updateConnection as updateConnectionService,
  deleteConnection as deleteConnectionService,
  getShapeConnections as getShapeConnectionsService,
  deleteShapeConnections
} from '../services/connections';
import { serializeShapes, calculatePasteOffset, applyOffsetToShapes, isClipboardDataValid } from '../utils/clipboard';
import { exportCanvas as exportCanvasUtil } from '../utils/export';
import {
  createComponent as createComponentService,
  deleteComponent as deleteComponentService,
  updateComponent as updateComponentService,
  subscribeToComponents
} from '../services/components';
import {
  createComment as createCommentService,
  updateComment as updateCommentService,
  deleteComment as deleteCommentService,
  resolveComment as resolveCommentService,
  unresolveComment as unresolveCommentService,
  subscribeToComments
} from '../services/comments';
import type { CanvasContextType, ShapeUpdateData, ShapeType, ShapeCreateData, Shape, ConnectionCreateData, ConnectionUpdateData, Connection, Component, ComponentUpdateData, Comment, CommentUpdateData } from '../utils/types';
import type Konva from 'konva';
import { GLOBAL_CANVAS_ID } from '../utils/constants';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * CanvasProvider component
 * Provides canvas state and methods to add/update/delete shapes
 * 
 * @param children - Child components to be wrapped by the provider
 */
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  // Grid snapping - Load from localStorage or default to true
  const [gridEnabled, setGridEnabled] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-grid-enabled');
    return saved !== null ? saved === 'true' : true; // Default to true
  });
  
  // Components state
  const [components, setComponents] = useState<Component[]>([]);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Clipboard for copy/cut/paste
  const { clipboardData, setClipboardData, incrementPasteCount, resetPasteCount } = useClipboard();
  
  // History for undo/redo
  const history = useHistory();
  const isPerformingHistoryAction = useRef(false); // Track if we're in undo/redo to avoid recording
  
  // Use the canvas hook for real-time synchronization
  // Wait for auth to be ready (not loading) before subscribing to Firestore
  const {
    shapes,
    groups,
    connections: connectionsFromFirestore,
    loading,
    addShape: addShapeHook,
    updateShape: updateShapeHook,
    deleteShape: deleteShapeHook,
  } = useCanvas(currentUser?.uid || 'anonymous', !authLoading);
  
  // Local optimistic connection updates (to provide immediate UI feedback)
  const [optimisticConnectionUpdates, setOptimisticConnectionUpdates] = useState<Map<string, Partial<Connection>>>(new Map());
  
  // Merge Firestore connections with optimistic updates
  const connections = useMemo(() => {
    return connectionsFromFirestore.map(conn => {
      const optimisticUpdate = optimisticConnectionUpdates.get(conn.id);
      if (!optimisticUpdate) return conn;
      
      // Merge updates, and explicitly delete fields that are set to undefined
      const merged = { ...conn, ...optimisticUpdate };
      Object.keys(optimisticUpdate).forEach(key => {
        if (optimisticUpdate[key as keyof typeof optimisticUpdate] === undefined) {
          delete merged[key as keyof typeof merged];
        }
      });
      
      return merged;
    });
  }, [connectionsFromFirestore, optimisticConnectionUpdates]);
  
  // Backward compatibility: selectedId is the first selected shape (or null)
  const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;
  
  // Track previous shapes to detect additions for history recording
  const prevShapesRef = useRef<string[]>([]);
  
  // Detect new shapes and record them in history
  useEffect(() => {
    if (isPerformingHistoryAction.current || !currentUser) return;
    
    const currentShapeIds = shapes.map(s => s.id);
    const prevShapeIds = prevShapesRef.current;
    
    // Find new shapes (in current but not in previous)
    const newShapeIds = currentShapeIds.filter(id => !prevShapeIds.includes(id));
    
    // Record new shapes to history
    newShapeIds.forEach(shapeId => {
      const newShape = shapes.find(s => s.id === shapeId);
      if (newShape && newShape.createdBy === currentUser.uid) {
        history.recordAction({
          type: 'create',
          shapesAffected: [shapeId],
          before: {},
          after: { [shapeId]: { ...newShape } },
          timestamp: Date.now(),
          userId: currentUser.uid,
        });
      }
    });
    
    // Update ref
    prevShapesRef.current = currentShapeIds;
  }, [shapes, currentUser, history]);
  
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
   * Supports multiple shape types: rectangle, circle, text, line
   * Syncs to Firestore in real-time
   * 
   * @param type - Shape type
   * @param position - Position where the shape should be created
   * @param customProperties - Optional custom properties to override defaults
   * @returns The ID of the created shape
   */
  const addShape = async (
    type: ShapeType,
    position: { x: number; y: number },
    customProperties?: Partial<ShapeCreateData>
  ): Promise<string> => {
    const shapeId = await addShapeHook(type, position, customProperties);
    
    // Record action after shape is added (skip if in undo/redo)
    // Note: We can't easily capture the new shape here due to async Firestore updates
    // History recording for create actions will happen via the shapes listener
    
    return shapeId;
  };

  /**
   * Update an existing shape
   * Syncs to Firestore in real-time
   * 
   * @param id - Shape ID to update
   * @param updates - Partial shape data to update
   */
  const updateShape = async (id: string, updates: ShapeUpdateData): Promise<void> => {
    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current || !currentUser) {
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
      userId: currentUser.uid,
    });
    
    await updateShapeHook(id, updates);
  };

  /**
   * Delete a shape from the canvas
   * Syncs to Firestore in real-time
   * 
   * @param id - Shape ID to delete
   */
  const deleteShape = async (id: string): Promise<void> => {
    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current || !currentUser) {
      await deleteShapeHook(id);
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
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
        userId: currentUser.uid,
      });
    }
    
    await deleteShapeHook(id);
    
    // Also delete any connections involving this shape
    try {
      await deleteShapeConnections(GLOBAL_CANVAS_ID, id);
    } catch (error) {
      console.error('Error deleting shape connections:', error);
      // Don't throw - shape deletion should still succeed even if connection cleanup fails
    }
    
    // Clear selection if deleted shape was selected
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  /**
   * Delete multiple shapes in a single atomic operation
   * Much faster than calling deleteShape multiple times
   * 
   * @param ids - Array of shape IDs to delete
   */
  const deleteMultipleShapes = async (ids: string[]): Promise<void> => {
    if (!currentUser || ids.length === 0) return;
    
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
        userId: currentUser.uid,
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
      // Don't throw - shape deletion should still succeed even if connection cleanup fails
    }
    
    // Clear selection
    setSelectedIds([]);
  };

  /**
   * Select or deselect a shape
   * Supports multi-select with Shift key
   * 
   * @param id - Shape ID to select, or null to deselect all
   * @param options - Options object with shift flag for multi-select
   */
  const selectShape = (id: string | null, options?: { shift?: boolean }): void => {
    if (id === null) {
      // Deselect all
      setSelectedIds([]);
      setSelectedConnectionId(null);
      return;
    }
    
    // Deselect any selected connection when selecting a shape
    setSelectedConnectionId(null);
    
    if (options?.shift) {
      // Shift+click: toggle shape in selection
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      // Normal click: select only this shape
      setSelectedIds([id]);
    }
  };

  /**
   * Select multiple shapes at once
   * Used for box selection to avoid state batching issues
   * 
   * @param ids - Array of shape IDs to select
   */
  const selectMultipleShapes = (ids: string[]): void => {
    // Deselect any selected connection when selecting shapes
    setSelectedConnectionId(null);
    setSelectedIds(ids);
  };

  /**
   * Check if a shape is currently selected
   * 
   * @param id - Shape ID to check
   * @returns true if the shape is selected
   */
  const isSelected = (id: string): boolean => {
    return selectedIds.includes(id);
  };

  /**
   * Lock a shape for exclusive editing
   * 
   * @param id - Shape ID to lock
   */
  const lockShape = async (id: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await lockShapeService(GLOBAL_CANVAS_ID, id, currentUser.uid);
    } catch (err) {
      console.error('Error locking shape:', err);
    }
  };

  /**
   * Unlock a shape
   * 
   * @param id - Shape ID to unlock
   */
  const unlockShape = async (id: string): Promise<void> => {
    try {
      await unlockShapeService(GLOBAL_CANVAS_ID, id);
    } catch (err) {
      console.error('Error unlocking shape:', err);
    }
  };

  /**
   * Duplicate a shape with 20px offset
   * 
   * @param id - Shape ID to duplicate
   */
  const duplicateShape = async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUser) return;
    
    // Check if shape is locked by another user
    if (shape.isLocked && shape.lockedBy !== currentUser.uid) {
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
      createdBy: currentUser.uid,
    };
    
    await createShapeService(GLOBAL_CANVAS_ID, duplicatedShape);
    
    // Select the duplicated shape after creation
    setTimeout(() => {
      selectShape(newId);
    }, 100);
    
    // Record the creation in history (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      // Wait for Firestore to sync
      setTimeout(() => {
        const createdShape = shapes.find(s => s.id === newId);
        if (createdShape) {
          history.recordAction({
            type: 'create',
            shapesAffected: [newId],
            before: {},
            after: { [newId]: { ...createdShape } },
            timestamp: Date.now(),
            userId: currentUser.uid,
          });
        }
      }, 200);
    }
  };

  /**
   * Bring a shape forward (increase zIndex)
   * 
   * @param id - Shape ID to bring forward
   */
  const bringForward = async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUser) return;
    
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
          userId: currentUser.uid,
        });
      }
      
      await updateShapeHook(id, { zIndex: newZIndex });
    }
  };

  /**
   * Send a shape back (decrease zIndex)
   * 
   * @param id - Shape ID to send back
   */
  const sendBack = async (id: string): Promise<void> => {
    const shape = shapes.find(s => s.id === id);
    if (!shape || !currentUser) return;
    
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
          userId: currentUser.uid,
        });
      }
      
      await updateShapeHook(id, { zIndex: newZIndex });
    }
  };

  /**
   * Align selected shapes
   * 
   * @param alignType - Type of alignment
   */
  const alignShapes = async (alignType: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom'): Promise<void> => {
    if (selectedIds.length < 2 || !currentUser) return;
    
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
          userId: currentUser.uid,
        });
      }, 200);
    } else {
      await alignShapesService(GLOBAL_CANVAS_ID, selectedIds, alignType, shapes);
    }
  };

  /**
   * Distribute selected shapes evenly
   * 
   * @param direction - Distribution direction
   */
  const distributeShapes = async (direction: 'horizontal' | 'vertical'): Promise<void> => {
    if (selectedIds.length < 3 || !currentUser) return;
    
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
          userId: currentUser.uid,
        });
      }, 200);
    } else {
      await distributeShapesService(GLOBAL_CANVAS_ID, selectedIds, direction, shapes);
    }
  };

  /**
   * Group selected shapes together
   * 
   * @param shapeIds - Array of shape IDs to group
   * @returns The ID of the created group
   */
  const groupShapes = async (shapeIds: string[]): Promise<string> => {
    if (shapeIds.length < 2 || !currentUser) {
      throw new Error('Need at least 2 shapes to create a group');
    }

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      const group = await createGroupService(GLOBAL_CANVAS_ID, shapeIds, currentUser.uid, shapes);
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
    const group = await createGroupService(GLOBAL_CANVAS_ID, shapeIds, currentUser.uid, shapes);

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
        userId: currentUser.uid,
      });
    }, 200);

    return group.id;
  };

  /**
   * Ungroup shapes (remove group but keep shapes)
   * 
   * @param groupId - The group ID to ungroup
   */
  const ungroupShapes = async (groupId: string): Promise<void> => {
    if (!currentUser) return;

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
        userId: currentUser.uid,
      });
    }, 200);
  };

  /**
   * Delete a group and all shapes within it (recursive)
   * 
   * @param groupId - The group ID to delete
   */
  const deleteGroup = async (groupId: string): Promise<void> => {
    if (!currentUser) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get all shapes that will be deleted (recursive)
    const shapeIds = getGroupShapesRecursive(groupId, shapes, groups);

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      await deleteGroupRecursive(GLOBAL_CANVAS_ID, groupId, shapes, groups);
      // Clear selection if any deleted shapes were selected
      setSelectedIds(selectedIds.filter(id => !shapeIds.includes(id)));
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
    setSelectedIds(selectedIds.filter(id => !shapeIds.includes(id)));

    // Record action
    history.recordAction({
      type: 'delete',
      shapesAffected: shapeIds,
      before,
      after: {},
      timestamp: Date.now(),
      userId: currentUser.uid,
    });
  };

  /**
   * Update style for all shapes in a group
   * 
   * @param groupId - The group ID
   * @param styleUpdates - Style updates to apply to all shapes in the group
   */
  const updateGroupStyle = async (
    groupId: string,
    styleUpdates: Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>
  ): Promise<void> => {
    if (!currentUser) return;

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
        userId: currentUser.uid,
      });
    }, 200);
  };

  /**
   * Update group bounding box after shapes have moved
   * 
   * @param groupId - The group ID to update
   */
  const updateGroupBounds = async (groupId: string): Promise<void> => {
    await updateGroupBoundsService(GLOBAL_CANVAS_ID, groupId, shapes);
  };

  /**
   * Duplicate a group and all its shapes
   * 
   * @param groupId - The group ID to duplicate
   * @returns The ID of the new group
   */
  const duplicateGroup = async (groupId: string): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Duplicate the group
    const newGroupId = await duplicateGroupService(GLOBAL_CANVAS_ID, groupId, currentUser.uid, shapes, groups);

    // Record action (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      // Wait for Firestore sync
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
            userId: currentUser.uid,
          });
        }
      }, 400);
    }

    return newGroupId;
  };

  /**
   * Get all shapes in a group (recursive)
   * 
   * @param groupId - The group ID
   * @returns Array of shapes in the group
   */
  const getGroupShapes = (groupId: string): Shape[] => {
    const shapeIds = getGroupShapesRecursive(groupId, shapes, groups);
    return shapes.filter(s => shapeIds.includes(s.id));
  };

  /**
   * Undo the last action
   * Restores the previous state of affected shapes
   */
  const undo = async (): Promise<void> => {
    const action = history.undo();
    if (!action || !currentUser) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Check if this is a bulk operation (has group data)
      if (action.groupsBefore !== undefined && action.groupsAfter !== undefined) {
        // Bulk operation - use atomic restore
        const shapesArray = Object.values(action.before).map(s => s as Shape);
        await restoreAllShapesService(GLOBAL_CANVAS_ID, shapesArray, action.groupsBefore);
      } else {
        // Individual shape or connection operations
        for (const id of action.shapesAffected) {
          const beforeState = action.before[id];
          const afterState = action.after[id];
          
          // Check if this is a connection (marked with type: 'connection')
          const isConnection = (afterState as any)?.type === 'connection' || (beforeState as any)?.type === 'connection';
          
          if (isConnection) {
            // Handle connection undo
            if (action.type === 'create') {
              // Undo create: delete the connection
              await deleteConnectionService(GLOBAL_CANVAS_ID, id);
              if (selectedConnectionId === id) {
                setSelectedConnectionId(null);
              }
            } else if (action.type === 'delete') {
              // Undo delete: recreate the connection
              if (beforeState) {
                const connData = beforeState as any;
                await addConnectionService(GLOBAL_CANVAS_ID, {
                  id: connData.id,
                  fromShapeId: connData.fromShapeId,
                  fromAnchor: connData.fromAnchor,
                  toShapeId: connData.toShapeId,
                  toAnchor: connData.toAnchor,
                  arrowType: connData.arrowType || 'end',
                  label: connData.label,
                  stroke: connData.stroke,
                  strokeWidth: connData.strokeWidth,
                  createdBy: connData.createdBy || currentUser.uid,
                });
              }
            }
          } else {
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
  };

  /**
   * Redo the next action
   * Restores the next state of affected shapes
   */
  const redo = async (): Promise<void> => {
    const action = history.redo();
    if (!action || !currentUser) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Check if this is a bulk operation (has group data)
      if (action.groupsBefore !== undefined && action.groupsAfter !== undefined) {
        // Bulk operation - use atomic restore
        const shapesArray = Object.values(action.after).map(s => s as Shape);
        await restoreAllShapesService(GLOBAL_CANVAS_ID, shapesArray, action.groupsAfter);
      } else {
        // Individual shape or connection operations
        for (const id of action.shapesAffected) {
          const beforeState = action.before[id];
          const afterState = action.after[id];
          
          // Check if this is a connection (marked with type: 'connection')
          const isConnection = (afterState as any)?.type === 'connection' || (beforeState as any)?.type === 'connection';
          
          if (isConnection) {
            // Handle connection redo
            if (action.type === 'create') {
              // Redo create: recreate the connection
              if (afterState) {
                const connData = afterState as any;
                await addConnectionService(GLOBAL_CANVAS_ID, {
                  id: connData.id,
                  fromShapeId: connData.fromShapeId,
                  fromAnchor: connData.fromAnchor,
                  toShapeId: connData.toShapeId,
                  toAnchor: connData.toAnchor,
                  arrowType: connData.arrowType || 'end',
                  label: connData.label,
                  stroke: connData.stroke,
                  strokeWidth: connData.strokeWidth,
                  createdBy: connData.createdBy || currentUser.uid,
                });
              }
            } else if (action.type === 'delete') {
              // Redo delete: delete the connection again
              await deleteConnectionService(GLOBAL_CANVAS_ID, id);
              if (selectedConnectionId === id) {
                setSelectedConnectionId(null);
              }
            }
          } else {
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
  };

  /**
   * Add a connection between two shapes
   * 
   * @param connectionData - Connection data
   * @returns Promise resolving to connection ID
   */
  const addConnection = async (connectionData: ConnectionCreateData): Promise<string> => {
    if (!currentUser) throw new Error('Must be logged in to add connections');
    
    try {
      const connectionId = await addConnectionService(GLOBAL_CANVAS_ID, connectionData);
      
      // Record connection creation in history
      if (!isPerformingHistoryAction.current) {
        history.recordAction({
          type: 'create',
          shapesAffected: [connectionId], // Use connection ID as affected "shape"
          before: {},
          after: {
            [connectionId]: {
              ...connectionData,
              id: connectionId,
              type: 'connection' as any, // Mark as connection for history tracking
            }
          },
          timestamp: Date.now(),
          userId: currentUser.uid,
        });
      }
      
      return connectionId;
    } catch (error) {
      console.error('Error adding connection:', error);
      throw error;
    }
  };

  /**
   * Update a connection
   * 
   * @param id - Connection ID
   * @param updates - Partial connection updates
   */
  const updateConnection = async (id: string, updates: ConnectionUpdateData): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to update connections');
    
    // Include lastModifiedBy in the actual Firebase update (not just optimistic)
    const updatesWithMetadata = {
      ...updates,
      lastModifiedBy: currentUser.uid,
    };
    
    // Optimistic update: immediately apply changes locally
    // IMPORTANT: Keep undefined values - they signal fields to be deleted
    const optimisticUpdate: any = {
      ...updatesWithMetadata,
      lastModifiedAt: Timestamp.now()
    };
    
    setOptimisticConnectionUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(id, optimisticUpdate);
      return newMap;
    });
    
    try {
      // Send update with lastModifiedBy to Firebase
      await updateConnectionService(GLOBAL_CANVAS_ID, id, updatesWithMetadata);
      
      // Clear optimistic update after Firebase confirms
      setOptimisticConnectionUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating connection:', error);
      // Revert optimistic update on error
      setOptimisticConnectionUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      throw error;
    }
  };

  /**
   * Delete a connection
   * 
   * @param id - Connection ID
   */
  const deleteConnection = async (id: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to delete connections');
    
    try {
      // Find the connection before deleting for history
      const connection = connections.find(c => c.id === id);
      
      await deleteConnectionService(GLOBAL_CANVAS_ID, id);
      
      // Record connection deletion in history
      if (!isPerformingHistoryAction.current && connection) {
        history.recordAction({
          type: 'delete',
          shapesAffected: [id],
          before: {
            [id]: {
              ...connection,
              type: 'connection' as any,
            }
          },
          after: {},
          timestamp: Date.now(),
          userId: currentUser.uid,
        });
      }
      
      // Clear selection if this connection was selected
      if (selectedConnectionId === id) {
        setSelectedConnectionId(null);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  };

  /**
   * Select a connection
   * 
   * @param id - Connection ID (null to deselect)
   */
  const selectConnection = (id: string | null): void => {
    setSelectedConnectionId(id);
    // Deselect shapes when selecting a connection
    if (id !== null) {
      setSelectedIds([]);
    }
  };

  /**
   * Get all connections for a specific shape
   * 
   * @param shapeId - Shape ID
   * @returns Array of connections involving this shape
   */
  const getShapeConnections = (shapeId: string): Connection[] => {
    return getShapeConnectionsService(connections, shapeId);
  };

  /**
   * Clear all shapes, groups, and connections from the canvas
   * Shows confirmation dialog and records as single undo/redo action
   */
  const clearAll = async (): Promise<void> => {
    if (!currentUser) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to clear everything from the canvas? This will affect all users.'
    );

    if (!confirmed) return;

    // Capture current state before deletion
    const shapesToDelete = [...shapes]; // Create a copy
    const groupsToDelete = [...groups]; // Create a copy
    const allShapeIds = shapesToDelete.map(s => s.id);

    // Skip recording if we're in undo/redo
    if (isPerformingHistoryAction.current) {
      // Single atomic operation to clear everything
      await clearAllShapesService(GLOBAL_CANVAS_ID);
      
      // Clear all selections
      setSelectedIds([]);
      setSelectedConnectionId(null);
      return;
    }

    // Capture current state of all shapes for history
    const before: Record<string, Partial<Shape>> = {};
    shapesToDelete.forEach(shape => {
      before[shape.id] = { ...shape };
    });

    // Single atomic operation to clear everything from Firestore (shapes, groups, and connections)
    await clearAllShapesService(GLOBAL_CANVAS_ID);

    // Clear all selections
    setSelectedIds([]);
    setSelectedConnectionId(null);

    // Record as single delete action with groups information
    history.recordAction({
      type: 'delete',
      shapesAffected: allShapeIds,
      before,
      after: {},
      groupsBefore: groupsToDelete,
      groupsAfter: [],
      timestamp: Date.now(),
      userId: currentUser.uid,
    });
  };

  /**
   * Copy selected shapes to clipboard
   * 
   * @param shapeIds - Array of shape IDs to copy
   */
  const copyShapes = (shapeIds: string[]): void => {
    if (shapeIds.length === 0) return;
    
    // Get the shapes to copy
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
  };

  /**
   * Cut selected shapes (copy + delete)
   * 
   * @param shapeIds - Array of shape IDs to cut
   */
  const cutShapes = async (shapeIds: string[]): Promise<void> => {
    if (shapeIds.length === 0) return;
    
    // Check if any shapes are locked by another user
    const lockedShapes = shapes.filter(
      s => shapeIds.includes(s.id) && s.isLocked && s.lockedBy !== currentUser?.uid
    );
    
    if (lockedShapes.length > 0) {
      console.warn('Cannot cut locked shapes');
      return;
    }
    
    // First copy to clipboard
    copyShapes(shapeIds);
    
    // Then delete the shapes
    await deleteMultipleShapes(shapeIds);
  };

  /**
   * Paste shapes from clipboard
   * Creates new shapes at viewport center with incremental offset
   */
  const pasteShapes = async (): Promise<void> => {
    if (!clipboardData || !isClipboardDataValid(clipboardData) || !currentUser) {
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
    const scale = stage.scaleX(); // Assume uniform scale
    
    // Transform viewport center to canvas coordinates
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
    
    // Calculate offset to move shapes from original center to viewport center
    // Plus incremental offset for multiple pastes
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
        createdBy: currentUser.uid,
      };
      
      await createShapeService(GLOBAL_CANVAS_ID, newShape);
      newShapeIds.push(newId);
    }
    
    // Increment paste count for next paste
    incrementPasteCount();
    
    // Select the newly pasted shapes
    setTimeout(() => {
      selectMultipleShapes(newShapeIds);
    }, 100);
    
    // Record the creation in history (skip if in undo/redo)
    if (!isPerformingHistoryAction.current) {
      // Wait for Firestore to sync
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
            userId: currentUser.uid,
          });
        }
      }, 200);
    }
  };

  /**
   * Export canvas as PNG or SVG
   * 
   * @param format - Export format (png or svg)
   * @param exportType - Type of export (fullCanvas, visibleArea, selection)
   */
  const exportCanvas = (format: 'png' | 'svg', exportType: 'fullCanvas' | 'visibleArea' | 'selection'): void => {
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
  };

  /**
   * Toggle grid snapping on/off
   */
  const toggleGrid = (): void => {
    setGridEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('collabcanvas-grid-enabled', String(newValue));
      return newValue;
    });
  };

  /**
   * Select all shapes of a specific type
   */
  const selectShapesByType = (shapeType: string): void => {
    const shapeIds = shapes
      .filter(shape => shape.type === shapeType)
      .map(shape => shape.id);
    selectMultipleShapes(shapeIds);
  };

  /**
   * Select all shapes within a lasso polygon
   */
  const selectShapesInLasso = (lassoPolygon: Array<{ x: number; y: number }>): void => {
    // Dynamically import selection utilities to avoid circular dependencies
    import('../utils/selection').then(({ getShapesInLasso }) => {
      const shapeIds = getShapesInLasso(shapes, lassoPolygon);
      selectMultipleShapes(shapeIds);
    });
  };

  /**
   * Create a component from selected shapes
   */
  const createComponent = async (name: string, description?: string): Promise<string> => {
    if (!currentUser || selectedIds.length === 0) {
      throw new Error('No shapes selected or user not authenticated');
    }

    // Get selected shapes
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
      createdBy: currentUser.uid,
      canvasId: GLOBAL_CANVAS_ID,
    });

    return componentId;
  };

  /**
   * Delete a component
   */
  const deleteComponent = async (componentId: string): Promise<void> => {
    await deleteComponentService(componentId);
  };

  /**
   * Update a component
   */
  const updateComponent = async (componentId: string, updates: ComponentUpdateData): Promise<void> => {
    if (!currentUser) return;
    await updateComponentService(componentId, {
      ...updates,
      lastModifiedBy: currentUser.uid,
    });
  };

  /**
   * Insert a component instance at viewport center
   */
  const insertComponent = async (componentId: string, position?: { x: number; y: number }): Promise<void> => {
    if (!currentUser) return;

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
      const scale = stage.scaleX(); // Assume uniform scale

      // Transform viewport center to canvas coordinates
      const viewportCenterCanvasX = (-stageX + stageWidth / 2) / scale;
      const viewportCenterCanvasY = (-stageY + stageHeight / 2) / scale;

      // Center the component at viewport center (accounting for component dimensions)
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
        createdBy: currentUser.uid,
      };

      await createShapeService(GLOBAL_CANVAS_ID, newShape);
      newShapeIds.push(newId);
    }

    // Select the newly created shapes
    setTimeout(() => {
      selectMultipleShapes(newShapeIds);
    }, 100);
  };

  /**
   * Create a comment on a shape
   */
  const createComment = async (text: string, shapeId: string, position?: { x: number; y: number }, parentId?: string): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const commentId = await createCommentService({
      text,
      shapeId,
      canvasId: GLOBAL_CANVAS_ID,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email || 'Anonymous',
      x: position?.x,
      y: position?.y,
      parentId,
    });

    return commentId;
  };

  /**
   * Update a comment
   */
  const updateComment = async (commentId: string, updates: CommentUpdateData): Promise<void> => {
    await updateCommentService(commentId, updates);
  };

  /**
   * Delete a comment
   */
  const deleteComment = async (commentId: string): Promise<void> => {
    await deleteCommentService(commentId);
  };

  /**
   * Resolve a comment
   */
  const resolveComment = async (commentId: string): Promise<void> => {
    if (!currentUser) return;
    await resolveCommentService(commentId, currentUser.uid);
  };

  /**
   * Unresolve a comment
   */
  const unresolveComment = async (commentId: string): Promise<void> => {
    await unresolveCommentService(commentId);
  };

  /**
   * Get all comments for a specific shape
   */
  const getShapeComments = (shapeId: string): Comment[] => {
    return comments.filter(comment => comment.shapeId === shapeId);
  };

  /**
   * Get total comment count for a shape (including resolved)
   */
  const getShapeCommentCount = (shapeId: string): number => {
    return comments.filter(comment => comment.shapeId === shapeId).length;
  };

  /**
   * Get unresolved comment count for a shape
   */
  const getShapeUnresolvedCommentCount = (shapeId: string): number => {
    return comments.filter(comment => comment.shapeId === shapeId && !comment.resolved).length;
  };

  const value: CanvasContextType = {
    shapes,
    groups,
    connections,
    selectedId,
    selectedIds,
    selectedConnectionId,
    loading,
    stageRef,
    addShape,
    updateShape,
    deleteShape,
    deleteMultipleShapes,
    selectShape,
    selectMultipleShapes,
    isSelected,
    lockShape,
    unlockShape,
    duplicateShape,
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
    addConnection,
    updateConnection,
    deleteConnection,
    selectConnection,
    getShapeConnections,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    clearAll,
    copyShapes,
    cutShapes,
    pasteShapes,
    hasClipboardData: isClipboardDataValid(clipboardData),
    exportCanvas,
    gridEnabled,
    toggleGrid,
    selectShapesByType,
    selectShapesInLasso,
    createComponent,
    deleteComponent,
    updateComponent,
    insertComponent,
    components,
    createComment,
    updateComment,
    deleteComment,
    resolveComment,
    unresolveComment,
    comments,
    getShapeComments,
    getShapeCommentCount,
    getShapeUnresolvedCommentCount,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};

/**
 * Hook to use the Canvas context
 * Throws an error if used outside of CanvasProvider
 * 
 * @returns CanvasContextType
 */
export const useCanvasContext = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

