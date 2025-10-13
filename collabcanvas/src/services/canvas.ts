import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shape, ShapeCreateData, ShapeUpdateData, CanvasDocument } from '../utils/types';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_FILL } from '../utils/constants';

/**
 * Canvas Service
 * Handles all Firestore operations for canvas data synchronization
 */

const CANVAS_COLLECTION = 'canvas';
const GLOBAL_CANVAS_ID = 'global-canvas-v1';

/**
 * Subscribe to real-time shape updates from Firestore
 * 
 * @param canvasId - The canvas document ID
 * @param callback - Function to call when shapes change
 * @returns Unsubscribe function
 */
export const subscribeToShapes = (
  canvasId: string,
  callback: (shapes: Shape[]) => void
): (() => void) => {
  const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);

  return onSnapshot(canvasRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as CanvasDocument;
      callback(data.shapes || []);
    } else {
      // Initialize empty canvas document if it doesn't exist
      initializeCanvas(canvasId);
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to shapes:', error);
    callback([]);
  });
};

/**
 * Initialize an empty canvas document
 * 
 * @param canvasId - The canvas document ID
 */
const initializeCanvas = async (canvasId: string): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    await setDoc(canvasRef, {
      canvasId,
      shapes: [],
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error initializing canvas:', error);
    throw error;
  }
};

/**
 * Create a new shape in Firestore
 * 
 * @param canvasId - The canvas document ID
 * @param shapeData - The shape data to create
 * @returns The created shape with full metadata
 */
export const createShape = async (
  canvasId: string,
  shapeData: ShapeCreateData
): Promise<Shape> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      await initializeCanvas(canvasId);
    }

    const now = Timestamp.now();
    const newShape: Shape = {
      id: shapeData.id || doc(db, 'temp').id,
      type: shapeData.type,
      x: shapeData.x,
      y: shapeData.y,
      width: shapeData.width || DEFAULT_SHAPE_WIDTH,
      height: shapeData.height || DEFAULT_SHAPE_HEIGHT,
      fill: shapeData.fill || DEFAULT_SHAPE_FILL,
      createdBy: shapeData.createdBy,
      createdAt: now,
      lastModifiedBy: shapeData.createdBy,
      lastModifiedAt: now,
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    };

    // Get current shapes and add the new one
    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = [...(currentData?.shapes || []), newShape];

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });

    return newShape;
  } catch (error) {
    console.error('Error creating shape:', error);
    throw error;
  }
};

/**
 * Update an existing shape in Firestore
 * 
 * @param canvasId - The canvas document ID
 * @param shapeId - The shape ID to update
 * @param updates - Partial shape data to update
 */
export const updateShape = async (
  canvasId: string,
  shapeId: string,
  updates: ShapeUpdateData
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = currentData.shapes.map((shape) =>
      shape.id === shapeId
        ? {
            ...shape,
            ...updates,
            lastModifiedAt: Timestamp.now(),
          }
        : shape
    );

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating shape:', error);
    throw error;
  }
};

/**
 * Delete a shape from Firestore
 * 
 * @param canvasId - The canvas document ID
 * @param shapeId - The shape ID to delete
 */
export const deleteShape = async (
  canvasId: string,
  shapeId: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = currentData.shapes.filter((shape) => shape.id !== shapeId);

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw error;
  }
};

/**
 * Lock a shape for exclusive editing
 * 
 * @param canvasId - The canvas document ID
 * @param shapeId - The shape ID to lock
 * @param userId - The user ID acquiring the lock
 */
export const lockShape = async (
  canvasId: string,
  shapeId: string,
  userId: string
): Promise<void> => {
  try {
    await updateShape(canvasId, shapeId, {
      isLocked: true,
      lockedBy: userId,
      lockedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error locking shape:', error);
    throw error;
  }
};

/**
 * Unlock a shape
 * 
 * @param canvasId - The canvas document ID
 * @param shapeId - The shape ID to unlock
 */
export const unlockShape = async (
  canvasId: string,
  shapeId: string
): Promise<void> => {
  try {
    await updateShape(canvasId, shapeId, {
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
    });
  } catch (error) {
    console.error('Error unlocking shape:', error);
    throw error;
  }
};

/**
 * Check and release stale locks (older than 5 seconds)
 * 
 * @param shapes - Array of shapes to check
 * @param canvasId - The canvas document ID
 * @returns Number of locks released
 */
export const checkAndReleaseStaleLocks = async (
  shapes: Shape[],
  canvasId: string
): Promise<number> => {
  const LOCK_TIMEOUT_MS = 5000; // 5 seconds
  const now = Date.now();
  let released = 0;

  for (const shape of shapes) {
    if (shape.isLocked && shape.lockedAt) {
      const lockAge = now - shape.lockedAt.toMillis();
      if (lockAge > LOCK_TIMEOUT_MS) {
        try {
          await unlockShape(canvasId, shape.id);
          released++;
        } catch (error) {
          console.error(`Failed to release stale lock for shape ${shape.id}:`, error);
        }
      }
    }
  }

  return released;
};

/**
 * Get the global canvas ID (used throughout the app)
 */
export const getGlobalCanvasId = (): string => GLOBAL_CANVAS_ID;

