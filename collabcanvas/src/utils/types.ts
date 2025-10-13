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

export interface Shape {
  id: string;
  type: 'rectangle';
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
}

// Shape creation data (what we need to create a new shape)
export interface ShapeCreateData {
  id?: string; // Optional ID (will be generated if not provided)
  type: 'rectangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  createdBy: string;
}

// Shape update data (partial updates)
export type ShapeUpdateData = Partial<Omit<Shape, 'id' | 'createdBy' | 'createdAt'>>;

// ============================================================================
// Canvas Document Structure
// ============================================================================

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
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
  selectedId: string | null;
  loading: boolean;
  stageRef: React.RefObject<any> | null;
  addShape: (type: 'rectangle', position: { x: number; y: number }) => Promise<void>;
  updateShape: (id: string, updates: ShapeUpdateData) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  selectShape: (id: string | null) => void;
  lockShape: (id: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
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

