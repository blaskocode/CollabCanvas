/**
 * Grid snapping and smart guide utilities
 */

import { GRID_SIZE, GUIDE_SNAP_THRESHOLD } from './constants';
import type { Shape } from './types';

export interface SnapResult {
  x: number;
  y: number;
  snapped: boolean;
}

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  alignmentType: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom';
}

/**
 * Snap position to grid
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param gridSize - Grid size in pixels
 * @returns Snapped coordinates
 */
export function snapToGrid(x: number, y: number, gridSize: number = GRID_SIZE): { x: number; y: number } {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

/**
 * Find alignment guides for a shape relative to other shapes
 * Returns guide lines when the shape aligns with edges or centers of other shapes
 * 
 * @param movingShape - The shape being moved
 * @param allShapes - All shapes on canvas (excluding the moving shape)
 * @param threshold - Snap threshold in pixels
 * @returns Array of alignment guides
 */
export function findAlignmentGuides(
  movingShape: { x: number; y: number; width?: number; height?: number; type?: string; radius?: number },
  allShapes: Shape[],
  threshold: number = GUIDE_SNAP_THRESHOLD
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  
  // Calculate moving shape edges and center based on type
  let movingLeft: number, movingRight: number, movingCenterX: number;
  let movingTop: number, movingBottom: number, movingCenterY: number;
  
  if (movingShape.type === 'circle' && movingShape.radius) {
    // For circles, x,y is the center
    movingCenterX = movingShape.x;
    movingCenterY = movingShape.y;
    movingLeft = movingShape.x - movingShape.radius;
    movingRight = movingShape.x + movingShape.radius;
    movingTop = movingShape.y - movingShape.radius;
    movingBottom = movingShape.y + movingShape.radius;
  } else {
    // For rectangles and other shapes, x,y is top-left
    const movingWidth = movingShape.width || 100;
    const movingHeight = movingShape.height || 100;
    movingLeft = movingShape.x;
    movingRight = movingShape.x + movingWidth;
    movingCenterX = movingShape.x + movingWidth / 2;
    movingTop = movingShape.y;
    movingBottom = movingShape.y + movingHeight;
    movingCenterY = movingShape.y + movingHeight / 2;
  }
  
  for (const shape of allShapes) {
    let shapeLeft: number, shapeRight: number, shapeCenterX: number;
    let shapeTop: number, shapeBottom: number, shapeCenterY: number;
    
    if (shape.type === 'circle' && shape.radius) {
      // For circles, x,y is the center
      shapeCenterX = shape.x;
      shapeCenterY = shape.y;
      shapeLeft = shape.x - shape.radius;
      shapeRight = shape.x + shape.radius;
      shapeTop = shape.y - shape.radius;
      shapeBottom = shape.y + shape.radius;
    } else {
      // For rectangles and other shapes, x,y is top-left
      const shapeWidth = shape.width || 100;
      const shapeHeight = shape.height || 100;
      shapeLeft = shape.x;
      shapeRight = shape.x + shapeWidth;
      shapeCenterX = shape.x + shapeWidth / 2;
      shapeTop = shape.y;
      shapeBottom = shape.y + shapeHeight;
      shapeCenterY = shape.y + shapeHeight / 2;
    }
    
    // Check vertical alignment (left, centerX, right)
    // Same edge alignment (left-to-left, right-to-right)
    if (Math.abs(movingLeft - shapeLeft) < threshold) {
      guides.push({ type: 'vertical', position: shapeLeft, alignmentType: 'left' });
    }
    if (Math.abs(movingCenterX - shapeCenterX) < threshold) {
      guides.push({ type: 'vertical', position: shapeCenterX, alignmentType: 'centerX' });
    }
    if (Math.abs(movingRight - shapeRight) < threshold) {
      guides.push({ type: 'vertical', position: shapeRight, alignmentType: 'right' });
    }
    
    // Cross edge alignment (left-to-right, right-to-left) for adjacent placement
    if (Math.abs(movingLeft - shapeRight) < threshold) {
      guides.push({ type: 'vertical', position: shapeRight, alignmentType: 'left' });
    }
    if (Math.abs(movingRight - shapeLeft) < threshold) {
      guides.push({ type: 'vertical', position: shapeLeft, alignmentType: 'right' });
    }
    
    // Check horizontal alignment (top, centerY, bottom)
    // Same edge alignment (top-to-top, bottom-to-bottom)
    if (Math.abs(movingTop - shapeTop) < threshold) {
      guides.push({ type: 'horizontal', position: shapeTop, alignmentType: 'top' });
    }
    if (Math.abs(movingCenterY - shapeCenterY) < threshold) {
      guides.push({ type: 'horizontal', position: shapeCenterY, alignmentType: 'centerY' });
    }
    if (Math.abs(movingBottom - shapeBottom) < threshold) {
      guides.push({ type: 'horizontal', position: shapeBottom, alignmentType: 'bottom' });
    }
    
    // Cross edge alignment (top-to-bottom, bottom-to-top) for adjacent placement
    if (Math.abs(movingTop - shapeBottom) < threshold) {
      guides.push({ type: 'horizontal', position: shapeBottom, alignmentType: 'top' });
    }
    if (Math.abs(movingBottom - shapeTop) < threshold) {
      guides.push({ type: 'horizontal', position: shapeTop, alignmentType: 'bottom' });
    }
  }
  
  // Remove duplicates
  const uniqueGuides = guides.filter((guide, index, self) =>
    index === self.findIndex(g =>
      g.type === guide.type &&
      g.position === guide.position &&
      g.alignmentType === guide.alignmentType
    )
  );
  
  return uniqueGuides;
}

/**
 * Apply smart guide snapping to position
 * Adjusts position to snap to alignment guides
 * 
 * @param x - Current x position
 * @param y - Current y position
 * @param movingShape - Shape being moved
 * @param guides - Array of alignment guides
 * @returns Snapped position
 */
export function applyGuideSnapping(
  x: number,
  y: number,
  movingShape: { width?: number; height?: number },
  guides: AlignmentGuide[]
): { x: number; y: number; snapped: boolean } {
  let snappedX = x;
  let snappedY = y;
  let snapped = false;
  
  const width = movingShape.width || 100;
  const height = movingShape.height || 100;
  
  for (const guide of guides) {
    if (guide.type === 'vertical') {
      // Adjust x based on alignment type
      if (guide.alignmentType === 'left') {
        snappedX = guide.position;
        snapped = true;
      } else if (guide.alignmentType === 'centerX') {
        snappedX = guide.position - width / 2;
        snapped = true;
      } else if (guide.alignmentType === 'right') {
        snappedX = guide.position - width;
        snapped = true;
      }
    } else if (guide.type === 'horizontal') {
      // Adjust y based on alignment type
      if (guide.alignmentType === 'top') {
        snappedY = guide.position;
        snapped = true;
      } else if (guide.alignmentType === 'centerY') {
        snappedY = guide.position - height / 2;
        snapped = true;
      } else if (guide.alignmentType === 'bottom') {
        snappedY = guide.position - height;
        snapped = true;
      }
    }
  }
  
  return { x: snappedX, y: snappedY, snapped };
}

/**
 * Get shapes that should be excluded from guide detection
 * (e.g., shapes in the same group as the moving shape)
 * 
 * @param allShapes - All shapes on canvas
 * @param movingShapeId - ID of shape being moved
 * @param selectedIds - IDs of selected shapes (for multi-select drag)
 * @returns Shapes that should be considered for alignment
 */
export function getShapesForAlignment(
  allShapes: Shape[],
  movingShapeId: string | null,
  selectedIds: string[]
): Shape[] {
  // Exclude moving shape and any selected shapes from alignment candidates
  const excludeIds = movingShapeId ? [movingShapeId, ...selectedIds] : selectedIds;
  return allShapes.filter(shape => !excludeIds.includes(shape.id));
}

