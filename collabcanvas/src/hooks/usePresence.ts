import { useState, useEffect, useRef } from 'react';
import {
  setUserOnline,
  setUserOffline,
  subscribeToPresence,
} from '../services/presence';
import { generateUserColor } from '../utils/helpers';
import type { PresenceUser } from '../utils/types';
import { GLOBAL_CANVAS_ID } from '../utils/constants';

/**
 * Hook for managing user presence (online/offline status)
 * 
 * @param userId - Current user ID
 * @param displayName - Current user's display name
 * @param enabled - Whether presence tracking is enabled
 * @returns Online users array
 */
export const usePresence = (
  userId: string | null,
  displayName: string | null,
  enabled: boolean = true
) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const userColorRef = useRef<string>('');
  const canvasId = GLOBAL_CANVAS_ID;

  // Generate user color once
  useEffect(() => {
    if (userId) {
      userColorRef.current = generateUserColor(userId);
    }
  }, [userId]);

  // Set user online and subscribe to presence updates
  useEffect(() => {
    if (!enabled || !userId || !displayName) return;

    // Set user as online
    setUserOnline(canvasId, userId, displayName, userColorRef.current);

    // Subscribe to presence updates
    const unsubscribe = subscribeToPresence(canvasId, (users) => {
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      setUserOffline(canvasId, userId);
    };
  }, [canvasId, userId, displayName, enabled]);

  return {
    onlineUsers,
    userColor: userColorRef.current,
  };
};

