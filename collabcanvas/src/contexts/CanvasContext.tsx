import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import { useHistory } from '../hooks/useHistory';
import { lockShape as lockShapeService, unlockShape as unlockShapeService, createShape as createShapeService, alignShapes as alignShapesService, distributeShapes as distributeShapesService } from '../services/canvas';
import type { CanvasContextType, ShapeUpdateData, ShapeType, ShapeCreateData } from '../utils/types';
import type Konva from 'konva';
import { GLOBAL_CANVAS_ID } from '../utils/constants';
import { doc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * CanvasProvider component
 * Provides canvas state and methods to add/update/delete shapes
 * 
 * @param children - Child components to be wrapped by the provider
 */
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const stageRef = useRef<Konva.Stage>(null);
  
  // History for undo/redo
  const history = useHistory();
  const isPerformingHistoryAction = useRef(false); // Track if we're in undo/redo to avoid recording
  
  // Use the canvas hook for real-time synchronization
  const {
    shapes,
    loading,
    addShape: addShapeHook,
    updateShape: updateShapeHook,
    deleteShape: deleteShapeHook,
  } = useCanvas(currentUser?.uid || 'anonymous');
  
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

  /**
   * Add a new shape to the canvas
   * Supports multiple shape types: rectangle, circle, text, line
   * Syncs to Firestore in real-time
   * 
   * @param type - Shape type
   * @param position - Position where the shape should be created
   */
  const addShape = async (type: ShapeType, position: { x: number; y: number }): Promise<void> => {
    await addShapeHook(type, position);
    
    // Record action after shape is added (skip if in undo/redo)
    // Note: We can't easily capture the new shape here due to async Firestore updates
    // History recording for create actions will happen via the shapes listener
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
    
    // Clear selection if deleted shape was selected
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
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
      return;
    }
    
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
    const newId = doc(collection(db, 'canvas')).id;
    
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
   * Undo the last action
   * Restores the previous state of affected shapes
   */
  const undo = (): void => {
    const action = history.undo();
    if (!action || !currentUser) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Restore the 'before' state for each affected shape
      action.shapesAffected.forEach(async (shapeId) => {
        const beforeState = action.before[shapeId];
        
        if (action.type === 'create') {
          // Undo create: delete the shape
          await deleteShapeHook(shapeId);
        } else if (action.type === 'delete') {
          // Undo delete: recreate the shape
          if (beforeState) {
            await createShapeService(GLOBAL_CANVAS_ID, beforeState as ShapeCreateData);
          }
        } else {
          // Undo update: restore previous values
          if (beforeState) {
            await updateShapeHook(shapeId, beforeState);
          }
        }
      });
    } finally {
      // Clear flag after a short delay to ensure all updates complete
      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 100);
    }
  };

  /**
   * Redo the next action
   * Restores the next state of affected shapes
   */
  const redo = (): void => {
    const action = history.redo();
    if (!action || !currentUser) return;

    // Set flag to prevent recording this as a new action
    isPerformingHistoryAction.current = true;

    try {
      // Restore the 'after' state for each affected shape
      action.shapesAffected.forEach(async (shapeId) => {
        const afterState = action.after[shapeId];
        
        if (action.type === 'create') {
          // Redo create: recreate the shape
          if (afterState) {
            await createShapeService(GLOBAL_CANVAS_ID, afterState as ShapeCreateData);
          }
        } else if (action.type === 'delete') {
          // Redo delete: delete the shape again
          await deleteShapeHook(shapeId);
        } else {
          // Redo update: apply the new values
          if (afterState) {
            await updateShapeHook(shapeId, afterState);
          }
        }
      });
    } finally {
      // Clear flag after a short delay to ensure all updates complete
      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 100);
    }
  };

  const value: CanvasContextType = {
    shapes,
    selectedId,
    selectedIds,
    loading,
    stageRef,
    addShape,
    updateShape,
    deleteShape,
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
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
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

