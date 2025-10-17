/**
 * Anchor Point Snapping Utilities
 * Handles calculation and snapping logic for workflow shape connectors
 */

import type { Shape, AnchorPosition } from './types';

/**
 * Snap radius in pixels - connectors will snap to anchors within this distance
 */
export const SNAP_RADIUS = 18;

/**
 * Anchor point visual size
 */
export const ANCHOR_POINT_RADIUS = 6;

/**
 * Calculate anchor point position for a shape
 * Takes into account rotation and scale transformations
 * 
 * @param shape - The shape to calculate anchor for
 * @param anchor - Which anchor point (top, right, bottom, left)
 * @returns Absolute x, y coordinates of the anchor point
 */
export function getAnchorPosition(shape: Shape, anchor: AnchorPosition): { x: number; y: number } {
  const { x, y, width, height, rotation = 0, scaleX = 1, scaleY = 1, type } = shape;
  
  // For circles, use radius to calculate dimensions
  let effectiveWidth = width;
  let effectiveHeight = height;
  
  if (type === 'circle') {
    const radius = (shape as any).radius || width / 2;
    effectiveWidth = radius * 2;
    effectiveHeight = radius * 2;
  }
  
  // Calculate scaled dimensions
  const scaledWidth = effectiveWidth * scaleX;
  const scaledHeight = effectiveHeight * scaleY;
  
  // Calculate local anchor position (relative to shape's top-left corner)
  let localX = 0;
  let localY = 0;
  
  switch (anchor) {
    case 'top':
      localX = scaledWidth / 2;
      localY = 0;
      break;
    case 'right':
      localX = scaledWidth;
      localY = scaledHeight / 2;
      break;
    case 'bottom':
      localX = scaledWidth / 2;
      localY = scaledHeight;
      break;
    case 'left':
      localX = 0;
      localY = scaledHeight / 2;
      break;
  }
  
  // If no rotation, just return the position
  if (!rotation || rotation === 0) {
    return { x: x + localX, y: y + localY };
  }
  
  // Apply rotation transformation
  // Rotate around the shape's top-left corner (x, y)
  const angleInRadians = (rotation * Math.PI) / 180;
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  
  // Rotate the local point around the origin
  const rotatedX = localX * cos - localY * sin;
  const rotatedY = localX * sin + localY * cos;
  
  return {
    x: x + rotatedX,
    y: y + rotatedY
  };
}

/**
 * Get all anchor positions for a shape
 * 
 * @param shape - The shape to get anchors for
 * @returns Array of anchor positions with their type
 */
export function getAllAnchors(shape: Shape): Array<{ anchor: AnchorPosition; x: number; y: number }> {
  const anchors: AnchorPosition[] = ['top', 'right', 'bottom', 'left'];
  return anchors.map(anchor => ({
    anchor,
    ...getAnchorPosition(shape, anchor)
  }));
}

/**
 * Find the nearest anchor point on a shape to a given position
 * 
 * @param shape - The shape to find anchor on
 * @param x - X coordinate to check from
 * @param y - Y coordinate to check from
 * @returns Nearest anchor position and distance, or null if shape has no anchors
 */
export function findNearestAnchor(
  shape: Shape,
  x: number,
  y: number
): { anchor: AnchorPosition; x: number; y: number; distance: number } | null {
  // Only workflow shapes and rectangles support anchor points
  const shapeSupportsAnchors = ['process', 'decision', 'startEnd', 'document', 'database', 'rectangle', 'circle', 'text'].includes(shape.type);
  
  if (!shapeSupportsAnchors) {
    return null;
  }
  
  const anchors = getAllAnchors(shape);
  let nearestAnchor = anchors[0];
  let minDistance = calculateDistance(x, y, nearestAnchor.x, nearestAnchor.y);
  
  for (const anchor of anchors) {
    const distance = calculateDistance(x, y, anchor.x, anchor.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestAnchor = anchor;
    }
  }
  
  return {
    ...nearestAnchor,
    distance: minDistance
  };
}

/**
 * Find the nearest anchor within snap radius
 * 
 * @param shapes - All shapes on canvas
 * @param x - X coordinate to check from
 * @param y - Y coordinate to check from
 * @param excludeShapeId - Optional shape ID to exclude from search
 * @returns Nearest snappable anchor or null
 */
export function findSnappableAnchor(
  shapes: Shape[],
  x: number,
  y: number,
  excludeShapeId?: string
): { shapeId: string; anchor: AnchorPosition; x: number; y: number } | null {
  let nearestSnap: { shapeId: string; anchor: AnchorPosition; x: number; y: number; distance: number } | null = null;
  
  for (const shape of shapes) {
    if (shape.id === excludeShapeId) continue;
    
    const nearestAnchor = findNearestAnchor(shape, x, y);
    if (!nearestAnchor) continue;
    
    if (nearestAnchor.distance <= SNAP_RADIUS) {
      if (!nearestSnap || nearestAnchor.distance < nearestSnap.distance) {
        nearestSnap = {
          shapeId: shape.id,
          anchor: nearestAnchor.anchor,
          x: nearestAnchor.x,
          y: nearestAnchor.y,
          distance: nearestAnchor.distance
        };
      }
    }
  }
  
  return nearestSnap ? {
    shapeId: nearestSnap.shapeId,
    anchor: nearestSnap.anchor,
    x: nearestSnap.x,
    y: nearestSnap.y
  } : null;
}

/**
 * Calculate distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Determine if a shape supports anchor points
 * 
 * @param shape - Shape to check
 * @returns true if shape supports anchors
 */
export function supportsAnchors(shape: Shape): boolean {
  return ['process', 'decision', 'startEnd', 'document', 'database', 'rectangle', 'circle', 'text'].includes(shape.type);
}

/**
 * Get the optimal anchor point for connecting from one shape to another
 * Based on relative positions
 * 
 * @param fromShape - Starting shape
 * @param toShape - Target shape
 * @returns Optimal anchor positions for both shapes
 */
export function getOptimalAnchors(
  fromShape: Shape,
  toShape: Shape
): { fromAnchor: AnchorPosition; toAnchor: AnchorPosition } {
  const fromCenter = {
    x: fromShape.x + fromShape.width / 2,
    y: fromShape.y + fromShape.height / 2
  };
  
  const toCenter = {
    x: toShape.x + toShape.width / 2,
    y: toShape.y + toShape.height / 2
  };
  
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  
  // Determine primary direction
  const angle = Math.atan2(dy, dx);
  const degrees = angle * (180 / Math.PI);
  
  let fromAnchor: AnchorPosition;
  let toAnchor: AnchorPosition;
  
  // Determine anchors based on angle
  if (degrees >= -45 && degrees < 45) {
    // To the right
    fromAnchor = 'right';
    toAnchor = 'left';
  } else if (degrees >= 45 && degrees < 135) {
    // Below
    fromAnchor = 'bottom';
    toAnchor = 'top';
  } else if (degrees >= -135 && degrees < -45) {
    // Above
    fromAnchor = 'top';
    toAnchor = 'bottom';
  } else {
    // To the left
    fromAnchor = 'left';
    toAnchor = 'right';
  }
  
  return { fromAnchor, toAnchor };
}

