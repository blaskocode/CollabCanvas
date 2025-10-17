/**
 * Selection utilities for lasso and other advanced selection methods
 */

import type { Shape } from './types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point - Point to check
 * @param polygon - Array of points forming the polygon
 * @returns True if point is inside polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get the bounding box of a shape
 * @param shape - Shape to get bounds for
 * @returns Bounding box { x, y, width, height }
 */
export function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  if (shape.type === 'circle' && shape.radius) {
    return {
      x: shape.x - shape.radius,
      y: shape.y - shape.radius,
      width: shape.radius * 2,
      height: shape.radius * 2,
    };
  } else {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width || 100,
      height: shape.height || 100,
    };
  }
}

/**
 * Get the corner points of a shape
 * @param shape - Shape to get corners for
 * @returns Array of corner points
 */
export function getShapeCorners(shape: Shape): Point[] {
  const bounds = getShapeBounds(shape);
  return [
    { x: bounds.x, y: bounds.y }, // Top-left
    { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
    { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
  ];
}

/**
 * Get the center point of a shape
 * @param shape - Shape to get center for
 * @returns Center point
 */
export function getShapeCenter(shape: Shape): Point {
  if (shape.type === 'circle') {
    return { x: shape.x, y: shape.y };
  } else {
    return {
      x: shape.x + (shape.width || 100) / 2,
      y: shape.y + (shape.height || 100) / 2,
    };
  }
}

/**
 * Check if a shape is inside a lasso polygon
 * A shape is considered inside if its center OR any of its corners are inside the polygon
 * @param shape - Shape to check
 * @param lassoPolygon - Lasso polygon points
 * @returns True if shape is inside lasso
 */
export function isShapeInLasso(shape: Shape, lassoPolygon: Point[]): boolean {
  if (lassoPolygon.length < 3) return false;

  // Check if center is inside
  const center = getShapeCenter(shape);
  if (isPointInPolygon(center, lassoPolygon)) {
    return true;
  }

  // Check if any corner is inside
  const corners = getShapeCorners(shape);
  for (const corner of corners) {
    if (isPointInPolygon(corner, lassoPolygon)) {
      return true;
    }
  }

  return false;
}

/**
 * Get all shapes inside a lasso polygon
 * @param shapes - All shapes on canvas
 * @param lassoPolygon - Lasso polygon points
 * @returns Array of shape IDs inside the lasso
 */
export function getShapesInLasso(shapes: Shape[], lassoPolygon: Point[]): string[] {
  return shapes
    .filter(shape => isShapeInLasso(shape, lassoPolygon))
    .map(shape => shape.id);
}

/**
 * Get all shapes of a specific type
 * @param shapes - All shapes on canvas
 * @param shapeType - Type of shape to select
 * @returns Array of shape IDs of the specified type
 */
export function getShapesOfType(shapes: Shape[], shapeType: string): string[] {
  return shapes
    .filter(shape => shape.type === shapeType)
    .map(shape => shape.id);
}

/**
 * Simplify a path by reducing the number of points (Douglas-Peucker algorithm)
 * @param points - Array of points
 * @param tolerance - Simplification tolerance (higher = more simplification)
 * @returns Simplified array of points
 */
export function simplifyPath(points: Point[], tolerance: number = 2): Point[] {
  if (points.length <= 2) return points;

  // Find the point with maximum distance from line segment
  let maxDistance = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const leftSegment = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const rightSegment = simplifyPath(points.slice(maxIndex), tolerance);

    // Concatenate without duplicating the middle point
    return leftSegment.slice(0, -1).concat(rightSegment);
  } else {
    // All points between start and end can be removed
    return [points[0], points[end]];
  }
}

/**
 * Calculate perpendicular distance from a point to a line segment
 * @param point - Point to measure distance from
 * @param lineStart - Start of line segment
 * @param lineEnd - End of line segment
 * @returns Perpendicular distance
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    // Line segment is a point
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    // Beyond the start of the segment
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  } else if (t > 1) {
    // Beyond the end of the segment
    return Math.sqrt(
      Math.pow(point.x - lineEnd.x, 2) + Math.pow(point.y - lineEnd.y, 2)
    );
  }

  // Perpendicular distance to the line segment
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt(
    Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2)
  );
}

