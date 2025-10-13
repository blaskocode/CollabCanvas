import React, { createContext, useContext, useState, useRef } from 'react';
import { doc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import type { CanvasContextType, Shape, ShapeUpdateData } from '../utils/types';
import type Konva from 'konva';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_FILL } from '../utils/constants';

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * CanvasProvider component
 * Provides canvas state and methods to add/update/delete shapes
 * 
 * @param children - Child components to be wrapped by the provider
 */
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const stageRef = useRef<Konva.Stage>(null);

  /**
   * Add a new shape to the canvas
   * Currently supports only rectangles for MVP
   * Uses Firebase doc().id for unique ID generation
   * 
   * @param type - Shape type (currently only 'rectangle')
   * @param position - Position where the shape should be created
   */
  const addShape = async (type: 'rectangle', position: { x: number; y: number }): Promise<void> => {
    // Generate unique ID using Firebase method
    const shapeId = doc(collection(db, 'canvas')).id;
    
    const newShape: Shape = {
      id: shapeId,
      type,
      x: position.x,
      y: position.y,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      fill: DEFAULT_SHAPE_FILL,
      createdBy: currentUser?.uid || 'anonymous',
      createdAt: new Date() as any, // TODO: Use Timestamp in PR #5
      lastModifiedBy: currentUser?.uid || 'anonymous',
      lastModifiedAt: new Date() as any,
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    };
    
    setShapes((prev) => [...prev, newShape]);
  };

  /**
   * Update an existing shape
   * 
   * @param id - Shape ID to update
   * @param updates - Partial shape data to update
   */
  const updateShape = async (id: string, updates: ShapeUpdateData): Promise<void> => {
    // TODO: This will be replaced with Firebase integration in PR #5
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === id
          ? {
              ...shape,
              ...updates,
              lastModifiedBy: currentUser?.uid || 'anonymous',
              lastModifiedAt: new Date() as any,
            }
          : shape
      )
    );
  };

  /**
   * Delete a shape from the canvas
   * 
   * @param id - Shape ID to delete
   */
  const deleteShape = async (id: string): Promise<void> => {
    // TODO: This will be replaced with Firebase integration in PR #5
    // Check if shape is locked by another user (will be relevant in PR #5)
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    
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

  const value: CanvasContextType = {
    shapes,
    selectedId,
    loading,
    stageRef,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
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

