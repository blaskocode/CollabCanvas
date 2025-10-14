/**
 * Canvas Configuration Constants
 */

// Canvas ID
export const GLOBAL_CANVAS_ID = 'global-canvas-v1';

// Realtime Database paths
export const SESSIONS_PATH = 'sessions';

// Canvas dimensions
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Viewport dimensions are calculated dynamically from window dimensions
// VIEWPORT_WIDTH = window.innerWidth
// VIEWPORT_HEIGHT = window.innerHeight - navbarHeight

// Zoom constraints
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

// Shape defaults
export const DEFAULT_SHAPE_WIDTH = 100;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_SHAPE_FILL = '#cccccc';

// Lock timeout (milliseconds)
export const LOCK_TIMEOUT_MS = 5000; // 5 seconds
export const LOCK_CHECK_INTERVAL_MS = 2000; // Check every 2 seconds

// Cursor update throttling
export const CURSOR_UPDATE_THROTTLE_MS = 33; // ~30 FPS (meets <50ms requirement)
export const CURSOR_POSITION_THRESHOLD_PX = 2; // Only update if moved >2px

// Display name constraints
export const MAX_DISPLAY_NAME_LENGTH = 20;

// Auto-pan configuration (when dragging shapes near viewport edge)
export const AUTO_PAN_EDGE_THRESHOLD = 50; // Pixels from viewport edge to trigger auto-pan
export const AUTO_PAN_SPEED_MAX = 10; // Maximum pixels to pan per frame
export const AUTO_PAN_SPEED_MIN = 2; // Minimum pixels to pan per frame

/**
 * User Color Palette
 * 10 distinct, high-contrast colors for user identification
 */
export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B739', // Orange
  '#52B788', // Green
] as const;

export type UserColor = typeof USER_COLORS[number];

