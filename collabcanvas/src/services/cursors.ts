import { ref, set, onValue, onDisconnect, remove, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import type { CursorPosition } from '../utils/types';

/**
 * Cursor Service
 * Handles real-time cursor position updates using Firebase Realtime Database
 */

const SESSIONS_PATH = 'sessions';
const GLOBAL_CANVAS_ID = 'global-canvas-v1';

/**
 * Update cursor position in Realtime Database
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 * @param x - Canvas X coordinate
 * @param y - Canvas Y coordinate
 * @param displayName - User's display name
 * @param color - User's cursor color
 */
export const updateCursorPosition = async (
  canvasId: string,
  userId: string,
  x: number,
  y: number,
  displayName: string,
  color: string
): Promise<void> => {
  try {
    const cursorRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}`);
    
    await set(cursorRef, {
      userId,
      displayName,
      cursorColor: color,
      cursorX: x,
      cursorY: y,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cursor position:', error);
    // Don't throw - cursor updates should fail silently
  }
};

/**
 * Subscribe to cursor positions for all users in a canvas session
 * 
 * @param canvasId - The canvas session ID
 * @param callback - Function called with cursor updates
 * @returns Unsubscribe function
 */
export const subscribeToCursors = (
  canvasId: string,
  callback: (cursors: Record<string, CursorPosition>) => void
): (() => void) => {
  const sessionRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}`);

  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      // Convert Firebase object to Record<string, CursorPosition>
      const cursors: Record<string, CursorPosition> = {};
      
      Object.keys(data).forEach((userId) => {
        const cursor = data[userId];
        cursors[userId] = {
          userId: cursor.userId,
          displayName: cursor.displayName,
          cursorColor: cursor.cursorColor,
          cursorX: cursor.cursorX,
          cursorY: cursor.cursorY,
          lastSeen: cursor.lastSeen || Date.now(),
        };
      });
      
      callback(cursors);
    } else {
      callback({});
    }
  }, (error) => {
    console.error('Error subscribing to cursors:', error);
    callback({});
  });

  return unsubscribe;
};

/**
 * Remove cursor from Realtime Database
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 */
export const removeCursor = async (
  canvasId: string,
  userId: string
): Promise<void> => {
  try {
    const cursorRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}`);
    await remove(cursorRef);
  } catch (error) {
    console.error('Error removing cursor:', error);
  }
};

/**
 * Set up automatic cursor cleanup on disconnect
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 */
export const setupCursorCleanup = (
  canvasId: string,
  userId: string
): void => {
  const cursorRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}`);
  onDisconnect(cursorRef).remove();
};

/**
 * Get the global canvas ID
 */
export const getGlobalCanvasId = (): string => GLOBAL_CANVAS_ID;

