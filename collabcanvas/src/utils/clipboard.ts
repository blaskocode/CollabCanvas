/**
 * Clipboard utilities for copy/cut/paste operations
 */

import type { Shape } from './types';

/**
 * Data structure for clipboard
 */
export interface ClipboardData {
  shapes: Shape[];
  timestamp: number;
  pasteCount: number;
}

/**
 * Serialize shapes for clipboard storage
 * Removes metadata fields that shouldn't be copied
 */
export function serializeShapes(shapes: Shape[]): Omit<Shape, 'id' | 'createdAt' | 'createdBy' | 'lastModifiedAt' | 'lastModifiedBy' | 'isLocked' | 'lockedBy' | 'lockedAt'>[] {
  return shapes.map(shape => {
    // Destructure to remove metadata fields
    const {
      id,
      createdAt,
      createdBy,
      lastModifiedAt,
      lastModifiedBy,
      isLocked,
      lockedBy,
      lockedAt,
      ...shapeData
    } = shape;
    
    return shapeData;
  });
}

/**
 * Calculate paste offset based on paste count
 * Each paste increments by 20px in both x and y
 */
export function calculatePasteOffset(pasteCount: number): { x: number; y: number } {
  const offsetIncrement = 20;
  return {
    x: offsetIncrement * pasteCount,
    y: offsetIncrement * pasteCount,
  };
}

/**
 * Apply offset to shapes for pasting
 */
export function applyOffsetToShapes(
  shapes: Omit<Shape, 'id' | 'createdAt' | 'createdBy' | 'lastModifiedAt' | 'lastModifiedBy' | 'isLocked' | 'lockedBy' | 'lockedAt'>[],
  offset: { x: number; y: number }
): typeof shapes {
  return shapes.map(shape => ({
    ...shape,
    x: shape.x + offset.x,
    y: shape.y + offset.y,
  }));
}

/**
 * Check if clipboard data is valid and not too old
 * @param clipboardData - The clipboard data to validate
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
export function isClipboardDataValid(clipboardData: ClipboardData | null, maxAgeMs: number = 3600000): boolean {
  if (!clipboardData) return false;
  if (!clipboardData.shapes || clipboardData.shapes.length === 0) return false;
  
  const age = Date.now() - clipboardData.timestamp;
  return age < maxAgeMs;
}

