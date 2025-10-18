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

export type ShapeType = 
  | 'rectangle' 
  | 'circle' 
  | 'text' 
  | 'line' 
  | 'process' 
  | 'decision' 
  | 'startEnd' 
  | 'document' 
  | 'database'
  // New geometric shapes
  | 'triangle'
  | 'rightTriangle'
  | 'hexagon'
  | 'octagon'
  | 'ellipse'
  // Form elements
  | 'textInput'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'button'
  | 'toggle'
  | 'slider';

// Anchor point positions for connectors
export type AnchorPosition = 
  | 'top' | 'right' | 'bottom' | 'left' 
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'top-center' | 'right-center' | 'bottom-center' | 'left-center';

// Arrow types for connectors
export type ArrowType = 'none' | 'end' | 'both';

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
  textColor?: string; // Text color (separate from shape fill), defaults to black or white based on luminance
  
  // Line-specific properties
  points?: [number, number, number, number]; // [x1, y1, x2, y2]
  
  // Form element-specific properties
  formOptions?: {
    placeholder?: string; // For text inputs
    items?: string[]; // For dropdowns, radio buttons
    label?: string; // For checkboxes, radio buttons, buttons
    checked?: boolean; // For checkboxes, toggles
    value?: number; // For sliders
    min?: number; // For sliders
    max?: number; // For sliders
  };
  
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
// Connection Types (for workflow connectors)
// ============================================================================

export interface Connection {
  id: string;
  // From endpoint - either anchored to shape or free-floating
  fromShapeId?: string;
  fromAnchor?: AnchorPosition;
  fromPoint?: { x: number; y: number };
  // To endpoint - either anchored to shape or free-floating
  toShapeId?: string;
  toAnchor?: AnchorPosition;
  toPoint?: { x: number; y: number };
  // Arrow configuration
  arrowStart?: boolean; // Show arrow at start
  arrowEnd?: boolean; // Show arrow at end
  arrowType?: ArrowType; // Legacy support, prefer arrowStart/arrowEnd
  // Routing
  orthogonalRouting?: boolean; // Use orthogonal (right-angle) routing
  // Styling
  stroke?: string;
  strokeWidth?: number;
  label?: string; // For "Yes/No" labels on decision branches
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  lastModifiedBy?: string;
  lastModifiedAt?: Timestamp;
}

// Connection creation data
export interface ConnectionCreateData {
  id?: string; // Optional ID (will be generated if not provided)
  // From endpoint
  fromShapeId?: string;
  fromAnchor?: AnchorPosition;
  fromPoint?: { x: number; y: number };
  // To endpoint
  toShapeId?: string;
  toAnchor?: AnchorPosition;
  toPoint?: { x: number; y: number };
  // Arrow configuration
  arrowStart?: boolean;
  arrowEnd?: boolean;
  arrowType?: ArrowType; // Legacy support
  // Routing
  orthogonalRouting?: boolean;
  // Styling
  stroke?: string;
  strokeWidth?: number;
  label?: string;
  createdBy: string;
}

// Connection update data (partial updates)
export type ConnectionUpdateData = Partial<Omit<Connection, 'id' | 'createdBy' | 'createdAt'>>;

// ============================================================================
// Canvas Document Structure
// ============================================================================

export interface CanvasDocument {
  canvasId: string;
  shapes: Shape[];
  groups?: ShapeGroup[]; // Groups collection
  connections?: Connection[]; // Connections collection
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
  connections: Connection[]; // All connections
  selectedId: string | null; // For backward compatibility
  selectedIds: string[]; // New: multi-select support
  selectedConnectionId: string | null; // Selected connection
  loading: boolean;
  stageRef: React.RefObject<any> | null;
  stagePos: { x: number; y: number };
  stageScale: number;
  setStagePos: (pos: { x: number; y: number }) => void;
  setStageScale: (scale: number) => void;
  addShape: (type: ShapeType, position: { x: number; y: number }, customProperties?: Partial<ShapeCreateData>) => Promise<string>;
  updateShape: (id: string, updates: ShapeUpdateData) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  deleteMultipleShapes: (ids: string[]) => Promise<void>;
  selectShape: (id: string | null, options?: { shift?: boolean }) => void;
  selectMultipleShapes: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  lockShape: (id: string) => Promise<void>;
  unlockShape: (id: string) => Promise<void>;
  duplicateShape: (id: string) => Promise<void>;
  bringForward: (id: string) => Promise<void>;
  sendBack: (id: string) => Promise<void>;
  moveShapesByArrowKey: (shapeIds: string[], dx: number, dy: number) => void;
  saveArrowKeyMovementToHistory: (shapeIds: string[], totalDx: number, totalDy: number, originalPositions: Map<string, { x: number; y: number }>) => void;
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
  // Connection operations
  addConnection: (connectionData: ConnectionCreateData) => Promise<string>; // Returns connection ID
  updateConnection: (id: string, updates: ConnectionUpdateData) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  selectConnection: (id: string | null) => void;
  getShapeConnections: (shapeId: string) => Connection[]; // Get all connections for a shape
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearAll: () => Promise<void>;
  // Clipboard operations
  copyShapes: (shapeIds: string[]) => void;
  cutShapes: (shapeIds: string[]) => Promise<void>;
  pasteShapes: () => Promise<void>;
  hasClipboardData: boolean;
  // Export operations
  exportCanvas: (format: 'png' | 'svg', exportType: 'fullCanvas' | 'visibleArea' | 'selection') => void;
  // Grid and snapping
  gridEnabled: boolean;
  toggleGrid: () => void;
  // Selection tools
  selectShapesByType: (shapeType: string) => void;
  selectShapesInLasso: (lassoPolygon: Array<{ x: number; y: number }>) => void;
  // Component operations
  createComponent: (name: string, description?: string) => Promise<string>; // Returns component ID
  deleteComponent: (componentId: string) => Promise<void>;
  updateComponent: (componentId: string, updates: ComponentUpdateData) => Promise<void>;
  insertComponent: (componentId: string, position?: { x: number; y: number }) => Promise<void>; // Position optional, defaults to viewport center
  components: Component[];
  // Comment operations
  createComment: (text: string, shapeId: string, position?: { x: number; y: number }, parentId?: string) => Promise<string>;
  updateComment: (commentId: string, updates: CommentUpdateData) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  unresolveComment: (commentId: string) => Promise<void>;
  comments: Comment[];
  getShapeComments: (shapeId: string) => Comment[];
  getShapeCommentCount: (shapeId: string) => number;
  getShapeUnresolvedCommentCount: (shapeId: string) => number;
}

// ============================================================================
// Color Palette Types
// ============================================================================

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[]; // Array of hex color codes
  createdAt: number;
}

export type RecentColors = string[]; // Array of recently used hex colors (max 10)

// ============================================================================
// Component Types (Reusable Components/Symbols)
// ============================================================================

export interface Component {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string; // Base64 data URL of component preview
  shapes: Omit<Shape, 'id' | 'createdBy' | 'createdAt' | 'lastModifiedBy' | 'lastModifiedAt' | 'isLocked' | 'lockedBy' | 'lockedAt'>[]; // Serialized shapes
  width: number; // Bounding box width
  height: number; // Bounding box height
  createdBy: string;
  createdAt: number;
  lastModifiedBy: string;
  lastModifiedAt: number;
  canvasId: string; // Canvas this component belongs to (global for now)
}

export interface ComponentCreateData {
  name: string;
  description?: string;
  shapes: Omit<Shape, 'id' | 'createdBy' | 'createdAt' | 'lastModifiedBy' | 'lastModifiedAt' | 'isLocked' | 'lockedBy' | 'lockedAt'>[];
  width: number;
  height: number;
  createdBy: string;
  canvasId: string;
}

export interface ComponentUpdateData {
  name?: string;
  description?: string;
  shapes?: Omit<Shape, 'id' | 'createdBy' | 'createdAt' | 'lastModifiedBy' | 'lastModifiedAt' | 'isLocked' | 'lockedBy' | 'lockedAt'>[];
  width?: number;
  height?: number;
  lastModifiedBy: string;
}

// ============================================================================
// Comment Types (Collaborative Comments/Annotations)
// ============================================================================

export interface Comment {
  id: string;
  shapeId: string; // Shape this comment is attached to
  canvasId: string;
  text: string;
  createdBy: string;
  createdByName: string; // Display name of creator
  createdAt: number;
  lastModifiedAt: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  x?: number; // Optional position (for visual indicator)
  y?: number;
  parentId?: string; // For threaded replies
}

export interface CommentCreateData {
  shapeId: string;
  canvasId: string;
  text: string;
  createdBy: string;
  createdByName: string;
  x?: number;
  y?: number;
  parentId?: string;
}

export interface CommentUpdateData {
  text?: string;
  resolved?: boolean;
  resolvedBy?: string;
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

