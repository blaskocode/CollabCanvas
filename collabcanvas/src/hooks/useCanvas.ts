import { useState, useEffect, useRef } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  subscribeToShapes,
  subscribeToGroups,
  createShape as createShapeService,
  createShapeByType,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  checkAndReleaseStaleLocks,
} from '../services/canvas';
import type { Shape, ShapeGroup, ShapeCreateData, ShapeUpdateData, ShapeType, Connection } from '../utils/types';
import { LOCK_CHECK_INTERVAL_MS, GLOBAL_CANVAS_ID } from '../utils/constants';
import toast from 'react-hot-toast';

/**
 * Subscribe to connections changes
 */
const subscribeToConnections = (
  canvasId: string,
  onUpdate: (connections: Connection[]) => void
): (() => void) => {
  const canvasRef = doc(db, 'canvases', canvasId);
  
  const unsubscribe = onSnapshot(
    canvasRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate(data.connections || []);
      } else {
        onUpdate([]);
      }
    },
    (error) => {
      console.error('Error subscribing to connections:', error);
      // Don't clear connections on error - keep cached/existing data
      // This prevents connections from disappearing during auth token propagation
    }
  );
  
  return unsubscribe;
};

/**
 * Hook for managing canvas shapes, groups, and connections with real-time Firestore synchronization
 * 
 * Note: Offline persistence is enabled in firebase.ts during initialization
 * 
 * @param userId - Current user ID
 * @param isAuthReady - Whether Firebase Auth has fully initialized (not loading)
 * @returns Canvas state and operations
 */
export const useCanvas = (userId: string, isAuthReady: boolean = true) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [groups, setGroups] = useState<ShapeGroup[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasId = GLOBAL_CANVAS_ID;
  
  // Store unsubscribe functions in a ref so cleanup can access them
  const unsubscribersRef = useRef<{
    shapes?: () => void;
    groups?: () => void;
    connections?: () => void;
  }>({});

  // Subscribe to real-time shape, group, and connection updates
  useEffect(() => {
    // Don't subscribe if auth is still loading or user is not authenticated
    if (!isAuthReady || !userId || userId === 'anonymous') {
      setLoading(!isAuthReady);
      return;
    }

    setLoading(true);
    setError(null);

    unsubscribersRef.current.shapes = subscribeToShapes(canvasId, (updatedShapes) => {
      setShapes(updatedShapes);
      setLoading(false);
    });

    unsubscribersRef.current.groups = subscribeToGroups(canvasId, (updatedGroups) => {
      setGroups(updatedGroups);
    });

    unsubscribersRef.current.connections = subscribeToConnections(canvasId, (updatedConnections) => {
      setConnections(updatedConnections);
    });

    return () => {
      unsubscribersRef.current.shapes?.();
      unsubscribersRef.current.groups?.();
      unsubscribersRef.current.connections?.();
      unsubscribersRef.current = {};
    };
  }, [canvasId, userId, isAuthReady]);

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
   * @returns The ID of the created shape
   */
  const addShape = async (
    type: ShapeType,
    position: { x: number; y: number },
    customProperties?: Partial<ShapeCreateData>
  ): Promise<string> => {
    try {
      // Generate unique ID using Firebase
      const shapeId = doc(collection(db, 'canvas')).id;

      // Use the shape factory to create shape with type-specific defaults
      // Custom properties will override defaults
      const shapeData: ShapeCreateData = {
        ...createShapeByType(type, position, userId, customProperties),
        id: shapeId,
      };

      await createShapeService(canvasId, shapeData);
      // Shape will be added to local state via onSnapshot
      return shapeId;
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

      await updateShapeService(canvasId, id, {
        ...updates,
        lastModifiedBy: userId,
      });
    } catch (err) {
      console.error('Error updating shape:', err);
      setError('Failed to update shape');
      toast.error('Failed to update shape. Changes will sync when connection is restored.');
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
    groups,
    connections,
    loading,
    error,
    addShape,
    updateShape,
    deleteShape,
  };
};

