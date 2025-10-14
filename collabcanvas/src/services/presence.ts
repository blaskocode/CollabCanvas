import { ref, set, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import type { PresenceUser } from '../utils/types';
import { SESSIONS_PATH } from '../utils/constants';

/**
 * Presence Service
 * Handles user online/offline status using Firebase Realtime Database
 * Shares the same path as cursor data: /sessions/{canvasId}/{userId}
 */

/**
 * Set user as online in the presence system
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 * @param displayName - User's display name
 * @param color - User's assigned color
 */
export const setUserOnline = async (
  canvasId: string,
  userId: string,
  displayName: string,
  color: string
): Promise<void> => {
  try {
    const userRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}`);
    
    // Set user online with initial data
    await set(userRef, {
      userId,
      displayName,
      cursorColor: color,
      cursorX: 0,
      cursorY: 0,
      lastSeen: serverTimestamp(),
      lockedShapes: [],
    });

    // Set up automatic cleanup on disconnect
    onDisconnect(userRef).remove();
  } catch (error) {
    console.error('Error setting user online:', error);
  }
};

/**
 * Set user as offline
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 */
export const setUserOffline = async (
  canvasId: string,
  userId: string
): Promise<void> => {
  try {
    const userRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}`);
    await remove(userRef);
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};

/**
 * Subscribe to presence updates for all users
 * 
 * @param canvasId - The canvas session ID
 * @param callback - Function called with presence updates
 * @returns Unsubscribe function
 */
export const subscribeToPresence = (
  canvasId: string,
  callback: (users: PresenceUser[]) => void
): (() => void) => {
  const sessionRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}`);

  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const users: PresenceUser[] = [];
      const now = Date.now();
      
      Object.keys(data).forEach((userId) => {
        const userData = data[userId];
        const age = now - (userData.lastSeen || 0);
        
        // Only include users seen in last 30 seconds
        if (age < 30000) {
          users.push({
            userId: userData.userId,
            displayName: userData.displayName,
            cursorColor: userData.cursorColor,
            lastSeen: userData.lastSeen || now,
            lockedShapes: userData.lockedShapes || [],
          });
        }
      });
      
      callback(users);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to presence:', error);
    callback([]);
  });

  return unsubscribe;
};

/**
 * Update the list of shapes locked by a user
 * 
 * @param canvasId - The canvas session ID
 * @param userId - User ID
 * @param shapeIds - Array of shape IDs locked by this user
 */
export const updateLockedShapes = async (
  canvasId: string,
  userId: string,
  shapeIds: string[]
): Promise<void> => {
  try {
    const lockedShapesRef = ref(rtdb, `${SESSIONS_PATH}/${canvasId}/${userId}/lockedShapes`);
    
    await set(lockedShapesRef, shapeIds);
  } catch (error) {
    console.error('Error updating locked shapes:', error);
  }
};


