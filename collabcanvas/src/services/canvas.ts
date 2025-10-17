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

const CANVAS_COLLECTION = 'canvases'; // Must match Firestore rules collection name

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
    // Don't clear shapes on error - keep cached/existing data
    // This prevents shapes from disappearing during auth token propagation
  });
};

/**
 * Subscribe to real-time group updates from Firestore
 * 
 * @param canvasId - The canvas document ID
 * @param callback - Function to call when groups change
 * @returns Unsubscribe function
 */
export const subscribeToGroups = (
  canvasId: string,
  callback: (groups: import('../utils/types').ShapeGroup[]) => void
): (() => void) => {
  const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);

  return onSnapshot(canvasRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as CanvasDocument;
      callback(data.groups || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to groups:', error);
    // Don't clear groups on error - keep cached/existing data
    // This prevents groups from disappearing during auth token propagation
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
      groups: [],
      connections: [],
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
 * @param customProperties - Optional custom properties to override defaults
 * @returns Shape creation data with type-specific properties
 */
export const createShapeByType = (
  type: ShapeType,
  position: { x: number; y: number },
  userId: string,
  customProperties?: Partial<ShapeCreateData>
): ShapeCreateData => {
  const baseShape = {
    type,
    x: position.x,
    y: position.y,
    createdBy: userId,
  };

  let defaults: ShapeCreateData;

  switch (type) {
    case 'rectangle':
      defaults = {
        ...baseShape,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        fill: DEFAULT_SHAPE_FILL,
      };
      break;
    
    case 'circle':
      defaults = {
        ...baseShape,
        width: 100, // Bounding box width
        height: 100, // Bounding box height
        fill: DEFAULT_SHAPE_FILL,
        radius: 50,
      };
      break;
    
    case 'text':
      defaults = {
        ...baseShape,
        width: 200,
        height: 50,
        fill: '#000000',
        text: 'Click to edit',
        fontSize: 16,
        fontFamily: 'Arial',
        textAlign: 'center',
        verticalAlign: 'middle',
        fontWeight: 'normal',
        fontStyle: 'normal',
      };
      break;
    
    case 'line':
      defaults = {
        ...baseShape,
        width: 100,
        height: 100,
        fill: '#000000',
        points: [0, 0, 100, 100], // Default diagonal line
      };
      break;
    
    default:
      defaults = {
        ...baseShape,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        fill: DEFAULT_SHAPE_FILL,
      };
  }

  // Merge custom properties with defaults (custom properties take precedence)
  return {
    ...defaults,
    ...customProperties,
    // Always preserve these base properties
    type,
    x: position.x,
    y: position.y,
    createdBy: userId,
  };
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
    
    // Add transform properties only if they are defined
    if (shapeData.rotation !== undefined) {
      newShape.rotation = shapeData.rotation;
    }
    if (shapeData.scaleX !== undefined) {
      newShape.scaleX = shapeData.scaleX;
    }
    if (shapeData.scaleY !== undefined) {
      newShape.scaleY = shapeData.scaleY;
    }
    if (shapeData.zIndex !== undefined) {
      newShape.zIndex = shapeData.zIndex;
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
    if (shapeData.verticalAlign !== undefined) {
      newShape.verticalAlign = shapeData.verticalAlign;
    }
    if (shapeData.fontWeight !== undefined) {
      newShape.fontWeight = shapeData.fontWeight;
    }
    if (shapeData.fontStyle !== undefined) {
      newShape.fontStyle = shapeData.fontStyle;
    }
    if (shapeData.textDecoration !== undefined) {
      newShape.textDecoration = shapeData.textDecoration;
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
    const filteredUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

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
            ...filteredUpdates,
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
 * Delete multiple shapes from Firestore in a single atomic operation
 * This is much faster and safer than deleting shapes one by one
 * 
 * @param canvasId - The canvas document ID
 * @param shapeIds - Array of shape IDs to delete
 */
export const deleteMultipleShapes = async (
  canvasId: string,
  shapeIds: string[]
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    // Filter out all shapes whose IDs are in the shapeIds array
    const updatedShapes = currentData.shapes.filter((shape) => !shapeIds.includes(shape.id));

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting multiple shapes:', error);
    throw error;
  }
};

/**
 * Clear all shapes, groups, and connections from the canvas in a single atomic operation
 * 
 * @param canvasId - The canvas document ID
 */
export const clearAllShapes = async (
  canvasId: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    
    // Single atomic update to clear shapes, groups, and connections arrays
    await updateDoc(canvasRef, {
      shapes: [],
      groups: [],
      connections: [],
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error clearing all shapes:', error);
    throw error;
  }
};

/**
 * Restore all shapes and groups to the canvas in a single atomic operation
 * Used for undo/redo operations
 * 
 * @param canvasId - The canvas document ID
 * @param shapes - Array of shapes to restore
 * @param groups - Array of groups to restore
 */
export const restoreAllShapes = async (
  canvasId: string,
  shapes: Shape[],
  groups: import('../utils/types').ShapeGroup[]
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    
    // Single atomic update to restore both shapes and groups arrays
    await updateDoc(canvasRef, {
      shapes,
      groups,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error restoring all shapes:', error);
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
 * Get shape bounds - helper function to calculate bounding box for any shape type
 * Handles rectangles, circles, text, and lines with their specific geometry
 */
const getShapeBounds = (shape: Shape): { x: number; y: number; width: number; height: number; centerX: number; centerY: number } => {
  if (shape.type === 'circle' && shape.radius) {
    // Circle: x,y is the CENTER in Konva, so calculate bounding box from that
    const width = shape.radius * 2;
    const height = shape.radius * 2;
    const bounds = {
      x: shape.x - shape.radius,
      y: shape.y - shape.radius,
      width,
      height,
      centerX: shape.x,
      centerY: shape.y,
    };
    return bounds;
  } else if (shape.type === 'line' && shape.points) {
    // Line: calculate bounding box from points
    const [x1, y1, x2, y2] = shape.points;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const width = maxX - minX;
    const height = maxY - minY;
    return {
      x: shape.x + minX,
      y: shape.y + minY,
      width,
      height,
      centerX: shape.x + (x1 + x2) / 2,
      centerY: shape.y + (y1 + y2) / 2,
    };
  } else {
    // Rectangle and Text: use width/height directly
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      centerX: shape.x + shape.width / 2,
      centerY: shape.y + shape.height / 2,
    };
  }
};

/**
 * Align multiple shapes
 * 
 * @param canvasId - The canvas document ID
 * @param shapeIds - Array of shape IDs to align
 * @param alignType - Type of alignment
 * @param shapes - All shapes array
 */
export const alignShapes = async (
  canvasId: string,
  shapeIds: string[],
  alignType: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom',
  shapes: Shape[]
): Promise<void> => {
  if (shapeIds.length < 2) return;

  const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
  
  // Calculate bounding box using proper bounds for each shape type
  const shapeBounds = selectedShapes.map(s => getShapeBounds(s));
  
  const bounds = {
    minX: Math.min(...shapeBounds.map(b => b.x)),
    maxX: Math.max(...shapeBounds.map(b => b.x + b.width)),
    minY: Math.min(...shapeBounds.map(b => b.y)),
    maxY: Math.max(...shapeBounds.map(b => b.y + b.height)),
  };
  
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  // Calculate new positions for each shape
  const updates = selectedShapes.map((shape, index) => {
    const shapeBound = shapeBounds[index];
    let newX = shape.x;
    let newY = shape.y;

    switch (alignType) {
      case 'left':
        // Align left edges
        newX = shape.x + (bounds.minX - shapeBound.x);
        break;
      case 'centerH':
        // Align horizontal centers
        newX = shape.x + (centerX - shapeBound.centerX);
        break;
      case 'right':
        // Align right edges
        newX = shape.x + (bounds.maxX - (shapeBound.x + shapeBound.width));
        break;
      case 'top':
        // Align top edges
        newY = shape.y + (bounds.minY - shapeBound.y);
        break;
      case 'centerV':
        // Align vertical centers
        newY = shape.y + (centerY - shapeBound.centerY);
        break;
      case 'bottom':
        // Align bottom edges
        newY = shape.y + (bounds.maxY - (shapeBound.y + shapeBound.height));
        break;
    }

    // Round to avoid floating point precision issues
    return { 
      id: shape.id, 
      x: Math.round(newX * 100) / 100, 
      y: Math.round(newY * 100) / 100 
    };
  });

  const actualUpdates = updates.filter(update => {
    const shape = selectedShapes.find(s => s.id === update.id);
    return shape && (Math.abs(shape.x - update.x) > 0.01 || Math.abs(shape.y - update.y) > 0.01);
  });

  if (actualUpdates.length === 0) {
    return;
  }

  const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
  const canvasSnap = await getDoc(canvasRef);
  const currentData = canvasSnap.data() as CanvasDocument;
  
  const updateMap = new Map(actualUpdates.map(u => [u.id, u]));
  
  const now = Timestamp.now();
  const updatedShapes = currentData.shapes.map(shape => {
    const update = updateMap.get(shape.id);
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

  await updateDoc(canvasRef, {
    shapes: updatedShapes,
    lastUpdated: serverTimestamp(),
  });
};

/**
 * Distribute shapes evenly
 * 
 * @param canvasId - The canvas document ID
 * @param shapeIds - Array of shape IDs to distribute
 * @param direction - Distribution direction ('horizontal' or 'vertical')
 * @param shapes - All shapes array
 */
export const distributeShapes = async (
  canvasId: string,
  shapeIds: string[],
  direction: 'horizontal' | 'vertical',
  shapes: Shape[]
): Promise<void> => {
  if (shapeIds.length < 3) {
    return;
  }

  const selectedShapes = shapes.filter(s => shapeIds.includes(s.id));
  
  const shapeBounds = selectedShapes.map(s => ({
    shape: s,
    bounds: getShapeBounds(s)
  }));
  
  const sortedShapeData = [...shapeBounds].sort((a, b) => {
    if (direction === 'horizontal') {
      return a.bounds.x - b.bounds.x;
    } else {
      return a.bounds.y - b.bounds.y;
    }
  });

  const firstShapeData = sortedShapeData[0];
  const lastShapeData = sortedShapeData[sortedShapeData.length - 1];
  
  const totalSpace = direction === 'horizontal'
    ? (lastShapeData.bounds.x + lastShapeData.bounds.width) - firstShapeData.bounds.x
    : (lastShapeData.bounds.y + lastShapeData.bounds.height) - firstShapeData.bounds.y;
  
  const totalShapeSize = sortedShapeData.reduce((sum, { bounds }) => {
    return sum + (direction === 'horizontal' ? bounds.width : bounds.height);
  }, 0);
  
  const gap = (totalSpace - totalShapeSize) / (sortedShapeData.length - 1);

  const updates: { id: string; x?: number; y?: number }[] = [];
  let currentPos = direction === 'horizontal' ? firstShapeData.bounds.x : firstShapeData.bounds.y;

  sortedShapeData.forEach(({ shape, bounds }, index) => {
    if (index === 0 || index === sortedShapeData.length - 1) {
      return;
    }

    if (direction === 'horizontal') {
      currentPos += sortedShapeData[index - 1].bounds.width + gap;
      const deltaX = currentPos - bounds.x;
      const newX = shape.x + deltaX;
      updates.push({ id: shape.id, x: Math.round(newX * 100) / 100 });
    } else {
      currentPos += sortedShapeData[index - 1].bounds.height + gap;
      const deltaY = currentPos - bounds.y;
      const newY = shape.y + deltaY;
      updates.push({ id: shape.id, y: Math.round(newY * 100) / 100 });
    }
  });

  if (updates.length === 0) {
    return;
  }

  const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
  const canvasSnap = await getDoc(canvasRef);
  const currentData = canvasSnap.data() as CanvasDocument;
  
  const updateMap = new Map(updates.map(u => [u.id, u]));
  
  const now = Timestamp.now();
  const updatedShapes = currentData.shapes.map(shape => {
    const update = updateMap.get(shape.id);
    if (update) {
      return {
        ...shape,
        ...(update.x !== undefined && { x: update.x }),
        ...(update.y !== undefined && { y: update.y }),
        lastModifiedAt: now,
      };
    }
    return shape;
  });

  await updateDoc(canvasRef, {
    shapes: updatedShapes,
    lastUpdated: serverTimestamp(),
  });
};


