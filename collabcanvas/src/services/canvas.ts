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
import type { Shape, ShapeCreateData, ShapeUpdateData, CanvasDocument, ShapeType } from '../utils/types';
import { DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT, DEFAULT_SHAPE_FILL } from '../utils/constants';

/**
 * Canvas Service
 * Handles all Firestore operations for canvas data synchronization
 */

const CANVAS_COLLECTION = 'canvas';

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
 * Create shape by type with type-specific defaults
 * 
 * @param type - The shape type
 * @param position - The position {x, y}
 * @param userId - The user ID creating the shape
 * @returns Shape creation data with type-specific properties
 */
export const createShapeByType = (
  type: ShapeType,
  position: { x: number; y: number },
  userId: string
): ShapeCreateData => {
  const baseShape = {
    type,
    x: position.x,
    y: position.y,
    createdBy: userId,
  };

  switch (type) {
    case 'rectangle':
      return {
        ...baseShape,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        fill: DEFAULT_SHAPE_FILL,
      };
    
    case 'circle':
      return {
        ...baseShape,
        width: 100, // Bounding box width
        height: 100, // Bounding box height
        fill: DEFAULT_SHAPE_FILL,
        radius: 50,
      };
    
    case 'text':
      return {
        ...baseShape,
        width: 200,
        height: 50,
        fill: '#000000',
        text: 'Click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
        textAlign: 'left',
      };
    
    case 'line':
      return {
        ...baseShape,
        width: 100,
        height: 100,
        fill: '#000000',
        points: [0, 0, 100, 100], // Default diagonal line
      };
    
    default:
      return {
        ...baseShape,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        fill: DEFAULT_SHAPE_FILL,
      };
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
    
    // Base shape with required fields
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

    // Add styling properties only if they are defined
    if (shapeData.stroke !== undefined) {
      newShape.stroke = shapeData.stroke;
    }
    if (shapeData.strokeWidth !== undefined) {
      newShape.strokeWidth = shapeData.strokeWidth;
    }
    if (shapeData.opacity !== undefined) {
      newShape.opacity = shapeData.opacity;
    }
    if (shapeData.cornerRadius !== undefined) {
      newShape.cornerRadius = shapeData.cornerRadius;
    }
    
    // Add shape-specific properties only if they are defined (Firestore doesn't accept undefined)
    if (shapeData.radius !== undefined) {
      newShape.radius = shapeData.radius;
    }
    if (shapeData.text !== undefined) {
      newShape.text = shapeData.text;
    }
    if (shapeData.fontSize !== undefined) {
      newShape.fontSize = shapeData.fontSize;
    }
    if (shapeData.fontFamily !== undefined) {
      newShape.fontFamily = shapeData.fontFamily;
    }
    if (shapeData.textAlign !== undefined) {
      newShape.textAlign = shapeData.textAlign;
    }
    if (shapeData.points !== undefined) {
      newShape.points = shapeData.points;
    }

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


