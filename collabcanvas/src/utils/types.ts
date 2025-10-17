import { Timestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Helper to convert Firebase User to our User type
export const toUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
});

// ============================================================================
// Shape Types
// ============================================================================

export type ShapeType = 'rectangle' | 'circle' | 'text' | 'line';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  
  // Layer management
  zIndex?: number; // Layer order (higher = on top)
  
  // Styling properties
  stroke?: string; // Border color (hex)
  strokeWidth?: number; // Border width (1-10px)
  opacity?: number; // Opacity (0-100)
  cornerRadius?: number; // Corner radius for rectangles (0-50px)
  
  // Transform properties
  rotation?: number; // Rotation in degrees (0-360)
  scaleX?: number; // Horizontal scale (1.0 = 100%)
  scaleY?: number; // Vertical scale (1.0 = 100%)
  
  // Circle-specific properties
  radius?: number;
  
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: string; // 'underline', 'line-through', or combination like 'underline line-through'
  
  // Line-specific properties
  points?: [number, number, number, number]; // [x1, y1, x2, y2]
  
  // Group membership
  groupId?: string; // ID of the group this shape belongs to (if any)
}

// Shape Group (for managing grouped shapes)
export interface ShapeGroup {
  id: string;
  canvasId: string;
  name?: string; // Optional group name
  shapeIds: string[]; // IDs of shapes in this group (can include other groups)
  x: number; // Group bounding box position
  y: number;
  width: number; // Group bounding box size
  height: number;
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
}

// Shape creation data (what we need to create a new shape)
export interface ShapeCreateData {
  id?: string; // Optional ID (will be generated if not provided)
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  createdBy: string;
  
  // Styling properties
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number;
  
  // Transform properties
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  
  // Layer management
  zIndex?: number;
  
  // Shape-specific properties
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: string;
  points?: [number, number, number, number];
}

// Shape update data (partial updates)
export type ShapeUpdateData = Partial<Omit<Shape, 'id' | 'createdBy' | 'createdAt'>>;

// ============================================================================
// Canvas Document Structure
// ============================================================================

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  groups?: ShapeGroup[]; // Groups collection
  lastUpdated: Timestamp;
}

// ============================================================================
// Cursor and Presence Types
// ============================================================================

export interface CursorPosition {
  userId: string;
  displayName: string;
  cursorColor: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
  cursorColor: string;
  lastSeen: number;
  lockedShapes: string[];
}

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export interface CanvasContextType {
  shapes: Shape[];
  groups: ShapeGroup[]; // All groups
  selectedId: string | null; // For backward compatibility
  selectedIds: string[]; // New: multi-select support
  loading: boolean;
  stageRef: React.RefObject<any> | null;
  addShape: (type: ShapeType, position: { x: number; y: number }, customProperties?: Partial<ShapeCreateData>) => Promise<void>;
  updateShape: (id: string, updates: ShapeUpdateData) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  selectShape: (id: string | null, options?: { shift?: boolean }) => void;
  selectMultipleShapes: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  lockShape: (id: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  duplicateShape: (id: string) => Promise<void>;
  bringForward: (id: string) => Promise<void>;
  sendBack: (id: string) => Promise<void>;
  alignShapes: (alignType: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => Promise<void>;
  distributeShapes: (direction: 'horizontal' | 'vertical') => Promise<void>;
  // Grouping operations
  groupShapes: (shapeIds: string[]) => Promise<string>; // Returns group ID
  ungroupShapes: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>; // Deletes group and all children
  updateGroupStyle: (groupId: string, styleUpdates: Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>) => Promise<void>;
  updateGroupBounds: (groupId: string) => Promise<void>; // Updates group bounding box
  duplicateGroup: (groupId: string) => Promise<string>; // Returns new group ID
  getGroupShapes: (groupId: string) => Shape[]; // Get all shapes in a group (recursive)
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearAll: () => Promise<void>;
}

// ============================================================================
// Konva Types (for canvas rendering)
// ============================================================================

// Re-export Konva types that we'll use throughout the app
export type { KonvaEventObject } from 'konva/lib/Node';

// ============================================================================
// Utility Types
// ============================================================================

// Position type for canvas coordinates
export interface Position {
  x: number;
  y: number;
}

// Size type for dimensions
export interface Size {
  width: number;
  height: number;
}

// Bounds type for canvas boundaries
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// ============================================================================
// Color Type
// ============================================================================

export type UserColor = string;

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

