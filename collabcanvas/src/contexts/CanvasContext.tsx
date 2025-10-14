import React, { createContext, useContext, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import { lockShape as lockShapeService, unlockShape as unlockShapeService } from '../services/canvas';
import type { CanvasContextType, ShapeUpdateData, ShapeType } from '../utils/types';
import type Konva from 'konva';
import { GLOBAL_CANVAS_ID } from '../utils/constants';

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * CanvasProvider component
 * Provides canvas state and methods to add/update/delete shapes
 * 
 * @param children - Child components to be wrapped by the provider
 */
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  // Use the canvas hook for real-time synchronization
  const {
    shapes,
    loading,
    addShape: addShapeHook,
    updateShape: updateShapeHook,
    deleteShape: deleteShapeHook,
  } = useCanvas(currentUser?.uid || 'anonymous');

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
  };

  /**
   * Update an existing shape
   * Syncs to Firestore in real-time
   * 
   * @param id - Shape ID to update
   * @param updates - Partial shape data to update
   */
  const updateShape = async (id: string, updates: ShapeUpdateData): Promise<void> => {
    await updateShapeHook(id, updates);
  };

  /**
   * Delete a shape from the canvas
   * Syncs to Firestore in real-time
   * 
   * @param id - Shape ID to delete
   */
  const deleteShape = async (id: string): Promise<void> => {
    await deleteShapeHook(id);
    
    // Clear selection if deleted shape was selected
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  /**
   * Select or deselect a shape
   * 
   * @param id - Shape ID to select, or null to deselect
   */
  const selectShape = (id: string | null): void => {
    setSelectedId(id);
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

  const value: CanvasContextType = {
    shapes,
    selectedId,
    loading,
    stageRef,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    lockShape,
    unlockShape,
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

