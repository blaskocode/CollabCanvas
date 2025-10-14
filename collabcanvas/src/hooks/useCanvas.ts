import { useState, useEffect } from 'react';
import { doc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  subscribeToShapes,
  createShape as createShapeService,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  checkAndReleaseStaleLocks,
  getGlobalCanvasId,
} from '../services/canvas';
import type { Shape, ShapeCreateData, ShapeUpdateData } from '../utils/types';
import { LOCK_CHECK_INTERVAL_MS } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Hook for managing canvas shapes with real-time Firestore synchronization
 * 
 * Note: Offline persistence is enabled in firebase.ts during initialization
 * 
 * @param userId - Current user ID
 * @returns Canvas state and operations
 */
export const useCanvas = (userId: string) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasId = getGlobalCanvasId();

  // Subscribe to real-time shape updates
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToShapes(canvasId, (updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasId]);

  // Periodically check and release stale locks
  useEffect(() => {
    const interval = setInterval(() => {
      if (shapes.length > 0) {
        checkAndReleaseStaleLocks(shapes, canvasId).catch((err) => {
          console.error('Error checking stale locks:', err);
        });
      }
    }, LOCK_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [shapes, canvasId]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Back online! Changes will sync automatically.');
    };

    const handleOffline = () => {
      toast.error('You are offline. Changes will sync when connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Add a new shape to the canvas
   */
  const addShape = async (type: 'rectangle', position: { x: number; y: number }): Promise<void> => {
    try {
      // Generate unique ID using Firebase
      const shapeId = doc(collection(db, 'canvas')).id;

      const shapeData: ShapeCreateData = {
        id: shapeId,
        type,
        x: position.x,
        y: position.y,
        width: 100,
        height: 100,
        fill: '#cccccc',
        createdBy: userId,
      };

      await createShapeService(canvasId, shapeData);
      // Shape will be added to local state via onSnapshot
    } catch (err) {
      console.error('Error adding shape:', err);
      setError('Failed to add shape');
      toast.error('Failed to create shape. Please try again.');
      throw err;
    }
  };

  /**
   * Update an existing shape
   */
  const updateShape = async (id: string, updates: ShapeUpdateData): Promise<void> => {
    try {
      // Optimistic update
      setShapes((prevShapes) =>
        prevShapes.map((shape) =>
          shape.id === id
            ? {
                ...shape,
                ...updates,
                lastModifiedBy: userId,
              }
            : shape
        )
      );

      // Update in Firestore
      await updateShapeService(canvasId, id, {
        ...updates,
        lastModifiedBy: userId,
      });
      // Firestore will sync back via onSnapshot
    } catch (err) {
      console.error('Error updating shape:', err);
      setError('Failed to update shape');
      toast.error('Failed to update shape. Changes will sync when connection is restored.');
      // Revert optimistic update on error - Firestore snapshot will restore correct state
      throw err;
    }
  };

  /**
   * Delete a shape
   */
  const deleteShape = async (id: string): Promise<void> => {
    try {
      // Optimistic update
      setShapes((prevShapes) => prevShapes.filter((shape) => shape.id !== id));

      // Delete from Firestore
      await deleteShapeService(canvasId, id);
      // Firestore will sync back via onSnapshot
    } catch (err) {
      console.error('Error deleting shape:', err);
      setError('Failed to delete shape');
      toast.error('Failed to delete shape. Please try again.');
      // Revert optimistic update on error - Firestore snapshot will restore correct state
      throw err;
    }
  };

  return {
    shapes,
    loading,
    error,
    addShape,
    updateShape,
    deleteShape,
  };
};

