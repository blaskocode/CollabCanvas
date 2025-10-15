import { 
  doc, 
  collection,
  getDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shape, ShapeGroup, CanvasDocument } from '../utils/types';
import { updateShape, createShape } from './canvas';

/**
 * Grouping Service
 * Handles all group-related operations including nested groups
 */

const CANVAS_COLLECTION = 'canvas';

/**
 * Calculate bounding box for a set of shapes
 * 
 * @param shapes - Array of shapes to calculate bounds for
 * @returns Bounding box { x, y, width, height }
 */
export const calculateBoundingBox = (shapes: Shape[]): { x: number; y: number; width: number; height: number } => {
  if (shapes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...shapes.map(s => s.x));
  const minY = Math.min(...shapes.map(s => s.y));
  const maxX = Math.max(...shapes.map(s => s.x + s.width));
  const maxY = Math.max(...shapes.map(s => s.y + s.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Get all shapes in a group recursively (including nested groups)
 * 
 * @param groupId - The group ID to get shapes for
 * @param allShapes - All shapes in the canvas
 * @param allGroups - All groups in the canvas
 * @returns Array of shape IDs (flattened, no duplicates)
 */
export const getGroupShapesRecursive = (
  groupId: string,
  allShapes: Shape[],
  allGroups: ShapeGroup[]
): string[] => {
  const group = allGroups.find(g => g.id === groupId);
  if (!group) return [];

  const shapeIds: string[] = [];

  group.shapeIds.forEach(id => {
    // Check if this is a nested group
    const nestedGroup = allGroups.find(g => g.id === id);
    if (nestedGroup) {
      // Recursively get shapes from nested group
      const nestedShapeIds = getGroupShapesRecursive(id, allShapes, allGroups);
      shapeIds.push(...nestedShapeIds);
    } else {
      // It's a shape, add it
      shapeIds.push(id);
    }
  });

  // Remove duplicates
  return [...new Set(shapeIds)];
};

/**
 * Create a new group from selected shapes
 * 
 * @param canvasId - The canvas document ID
 * @param shapeIds - Array of shape IDs to group (can include other groups)
 * @param userId - The user creating the group
 * @param allShapes - All shapes in the canvas
 * @returns The created group
 */
export const createGroup = async (
  canvasId: string,
  shapeIds: string[],
  userId: string,
  allShapes: Shape[]
): Promise<ShapeGroup> => {
  try {
    if (shapeIds.length < 2) {
      throw new Error('Need at least 2 shapes to create a group');
    }

    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    
    // Get the shapes being grouped
    const shapesToGroup = allShapes.filter(s => shapeIds.includes(s.id));
    
    // Calculate bounding box
    const bounds = calculateBoundingBox(shapesToGroup);
    
    // Generate new group ID using collection reference
    const groupId = doc(collection(db, 'canvas')).id;
    
    const now = Timestamp.now();
    
    // Create the group
    const newGroup: ShapeGroup = {
      id: groupId,
      canvasId,
      shapeIds,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      createdBy: userId,
      createdAt: now,
      lastModifiedBy: userId,
      lastModifiedAt: now,
    };

    // Update all shapes to reference this group
    const updatedShapes = currentData.shapes.map(shape => 
      shapeIds.includes(shape.id)
        ? { ...shape, groupId }
        : shape
    );

    // Add group to groups array
    const updatedGroups = [...(currentData.groups || []), newGroup];

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      groups: updatedGroups,
      lastUpdated: serverTimestamp(),
    });

    return newGroup;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

/**
 * Ungroup shapes (remove group but keep shapes)
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID to ungroup
 */
export const ungroupShapes = async (
  canvasId: string,
  groupId: string
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    const group = currentData.groups?.find(g => g.id === groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }

    // Remove groupId from all shapes in this group
    const updatedShapes = currentData.shapes.map(shape => {
      if (shape.groupId === groupId) {
        // Remove the groupId field entirely (destructure it out)
        const { groupId: _, ...shapeWithoutGroupId } = shape;
        return shapeWithoutGroupId;
      }
      return shape;
    });

    // Remove the group
    const updatedGroups = (currentData.groups || []).filter(g => g.id !== groupId);

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      groups: updatedGroups,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error ungrouping shapes:', error);
    throw error;
  }
};

/**
 * Delete a group and all shapes within it (recursive for nested groups)
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID to delete
 * @param allShapes - All shapes in the canvas
 * @param allGroups - All groups in the canvas
 * @returns Array of deleted shape IDs and group IDs
 */
export const deleteGroupRecursive = async (
  canvasId: string,
  groupId: string,
  allShapes: Shape[],
  allGroups: ShapeGroup[]
): Promise<{ deletedShapeIds: string[]; deletedGroupIds: string[] }> => {
  try {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const deletedShapeIds: string[] = [];
    const deletedGroupIds: string[] = [groupId];

    // Process each member of the group
    for (const memberId of group.shapeIds) {
      // Check if member is a nested group
      const nestedGroup = allGroups.find(g => g.id === memberId);
      if (nestedGroup) {
        // Recursively delete nested group
        const result = await deleteGroupRecursive(canvasId, memberId, allShapes, allGroups);
        deletedShapeIds.push(...result.deletedShapeIds);
        deletedGroupIds.push(...result.deletedGroupIds);
      } else {
        // It's a shape, add to deletion list
        deletedShapeIds.push(memberId);
      }
    }

    // Get current canvas state
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;

    // Remove shapes
    const updatedShapes = currentData.shapes.filter(
      shape => !deletedShapeIds.includes(shape.id)
    );

    // Remove groups
    const updatedGroups = (currentData.groups || []).filter(
      g => !deletedGroupIds.includes(g.id)
    );

    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      groups: updatedGroups,
      lastUpdated: serverTimestamp(),
    });

    return { deletedShapeIds, deletedGroupIds };
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

/**
 * Update style for all shapes in a group (recursive)
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID
 * @param styleUpdates - Style updates to apply
 * @param allShapes - All shapes in the canvas
 * @param allGroups - All groups in the canvas
 */
export const updateGroupStyle = async (
  canvasId: string,
  groupId: string,
  styleUpdates: Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>,
  allShapes: Shape[],
  allGroups: ShapeGroup[]
): Promise<void> => {
  try {
    // Get all shape IDs in group (recursive)
    const shapeIds = getGroupShapesRecursive(groupId, allShapes, allGroups);

    // Update each shape
    await Promise.all(
      shapeIds.map(shapeId => updateShape(canvasId, shapeId, styleUpdates))
    );
  } catch (error) {
    console.error('Error updating group style:', error);
    throw error;
  }
};

/**
 * Duplicate a group and all its shapes (recursive)
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID to duplicate
 * @param userId - The user duplicating the group
 * @param allShapes - All shapes in the canvas
 * @param allGroups - All groups in the canvas
 * @param offset - Offset for duplicated shapes (default: { x: 20, y: 20 })
 * @returns The ID of the new group
 */
export const duplicateGroup = async (
  canvasId: string,
  groupId: string,
  userId: string,
  allShapes: Shape[],
  allGroups: ShapeGroup[],
  offset: { x: number; y: number } = { x: 20, y: 20 }
): Promise<string> => {
  try {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Map to track old IDs to new IDs
    const idMap: Record<string, string> = {};

    // Duplicate all shapes in the group (recursively)
    for (const memberId of group.shapeIds) {
      const nestedGroup = allGroups.find(g => g.id === memberId);
      
      if (nestedGroup) {
        // Duplicate nested group
        const newNestedGroupId = await duplicateGroup(
          canvasId,
          memberId,
          userId,
          allShapes,
          allGroups,
          offset
        );
        idMap[memberId] = newNestedGroupId;
      } else {
        // Duplicate shape
        const shape = allShapes.find(s => s.id === memberId);
        if (shape) {
          const newId = doc(collection(db, 'canvas')).id;
          idMap[memberId] = newId;

          const { id: _id, createdAt, createdBy, lastModifiedAt, lastModifiedBy, isLocked, lockedBy, lockedAt, groupId: _groupId, ...shapeData } = shape;
          
          await createShape(canvasId, {
            ...shapeData,
            id: newId,
            type: shape.type,
            x: shape.x + offset.x,
            y: shape.y + offset.y,
            createdBy: userId,
          });
        }
      }
    }

    // Wait a bit for Firestore to sync
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create new group with duplicated members
    const newGroupId = doc(collection(db, 'canvas')).id;
    const newShapeIds = group.shapeIds.map(id => idMap[id] || id);

    // Fetch updated shapes to calculate correct bounding box
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);
    const currentData = canvasSnap.data() as CanvasDocument;
    const updatedShapes = currentData?.shapes || [];

    const newShapes = updatedShapes.filter(s => newShapeIds.includes(s.id));
    const bounds = calculateBoundingBox(newShapes);

    const now = Timestamp.now();
    
    const newGroup: ShapeGroup = {
      id: newGroupId,
      canvasId,
      name: group.name ? `${group.name} Copy` : undefined,
      shapeIds: newShapeIds,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      createdBy: userId,
      createdAt: now,
      lastModifiedBy: userId,
      lastModifiedAt: now,
    };

    // Update shapes to reference new group
    const finalShapes = currentData.shapes.map(shape =>
      newShapeIds.includes(shape.id)
        ? { ...shape, groupId: newGroupId }
        : shape
    );

    // Add new group
    const finalGroups = [...(currentData.groups || []), newGroup];

    await updateDoc(canvasRef, {
      shapes: finalShapes,
      groups: finalGroups,
      lastUpdated: serverTimestamp(),
    });

    return newGroupId;
  } catch (error) {
    console.error('Error duplicating group:', error);
    throw error;
  }
};

/**
 * Update group bounding box after shapes have moved
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID
 * @param allShapes - All shapes in the canvas
 */
export const updateGroupBounds = async (
  canvasId: string,
  groupId: string,
  allShapes: Shape[]
): Promise<void> => {
  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const canvasSnap = await getDoc(canvasRef);

    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }

    const currentData = canvasSnap.data() as CanvasDocument;
    const group = currentData.groups?.find(g => g.id === groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Get shapes in group
    const groupShapes = allShapes.filter(s => group.shapeIds.includes(s.id));
    const bounds = calculateBoundingBox(groupShapes);

    // Update group bounds
    const updatedGroups = (currentData.groups || []).map(g =>
      g.id === groupId
        ? { ...g, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, lastModifiedAt: Timestamp.now() }
        : g
    );

    await updateDoc(canvasRef, {
      groups: updatedGroups,
      lastUpdated: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating group bounds:', error);
    throw error;
  }
};

/**
 * Move all shapes in a group by delta
 * 
 * @param canvasId - The canvas document ID
 * @param groupId - The group ID
 * @param deltaX - X offset
 * @param deltaY - Y offset
 * @param allShapes - All shapes in the canvas
 * @param allGroups - All groups in the canvas
 */
export const moveGroup = async (
  canvasId: string,
  groupId: string,
  deltaX: number,
  deltaY: number,
  allShapes: Shape[],
  allGroups: ShapeGroup[]
): Promise<void> => {
  try {
    // Get all shape IDs in group (recursive)
    const shapeIds = getGroupShapesRecursive(groupId, allShapes, allGroups);

    // Move each shape
    await Promise.all(
      shapeIds.map(shapeId => {
        const shape = allShapes.find(s => s.id === shapeId);
        if (shape) {
          return updateShape(canvasId, shapeId, {
            x: shape.x + deltaX,
            y: shape.y + deltaY,
          });
        }
        return Promise.resolve();
      })
    );

    // Update group bounds
    await updateGroupBounds(canvasId, groupId, allShapes);
  } catch (error) {
    console.error('Error moving group:', error);
    throw error;
  }
};

