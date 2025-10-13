import { useState, useEffect, useRef, useCallback } from 'react';
import {
  subscribeToCursors,
  updateCursorPosition,
  removeCursor,
  setupCursorCleanup,
  getGlobalCanvasId,
} from '../services/cursors';
import { generateUserColor } from '../utils/helpers';
import type { CursorPosition } from '../utils/types';
import { CURSOR_UPDATE_THROTTLE_MS, CURSOR_POSITION_THRESHOLD_PX } from '../utils/constants';

/**
 * Hook for managing real-time cursor positions
 * 
 * @param userId - Current user ID
 * @param displayName - Current user's display name
 * @param enabled - Whether cursor tracking is enabled
 * @returns Cursors object and update function
 */
export const useCursors = (userId: string | null, displayName: string | null, enabled: boolean = true) => {
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const lastUpdateRef = useRef<number>(0);
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userColorRef = useRef<string>('');
  
  const canvasId = getGlobalCanvasId();

  // Generate user color once
  useEffect(() => {
    if (userId) {
      userColorRef.current = generateUserColor(userId);
    }
  }, [userId]);

  // Subscribe to cursor updates
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToCursors(canvasId, (updatedCursors) => {
      // Filter out stale cursors (>10 seconds old)
      const now = Date.now();
      const activeCursors: Record<string, CursorPosition> = {};
      
      Object.keys(updatedCursors).forEach((uid) => {
        const cursor = updatedCursors[uid];
        const age = now - cursor.lastSeen;
        
        // Only include cursors updated in last 10 seconds
        if (age < 10000) {
          activeCursors[uid] = cursor;
        }
      });
      
      setCursors(activeCursors);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasId, enabled]);

  // Set up disconnect cleanup
  useEffect(() => {
    if (!enabled || !userId) return;

    setupCursorCleanup(canvasId, userId);

    // Clean up on unmount
    return () => {
      if (userId) {
        removeCursor(canvasId, userId);
      }
    };
  }, [canvasId, userId, enabled]);

  /**
   * Update cursor position with throttling and threshold checks
   * 
   * @param x - Canvas X coordinate
   * @param y - Canvas Y coordinate
   */
  const updateCursor = useCallback((x: number, y: number) => {
    if (!enabled || !userId || !displayName) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Check if position changed significantly
    const dx = Math.abs(x - lastPositionRef.current.x);
    const dy = Math.abs(y - lastPositionRef.current.y);
    const movedEnough = dx > CURSOR_POSITION_THRESHOLD_PX || dy > CURSOR_POSITION_THRESHOLD_PX;

    // Only update if throttle time passed AND position changed enough
    if (timeSinceLastUpdate >= CURSOR_UPDATE_THROTTLE_MS && movedEnough) {
      lastUpdateRef.current = now;
      lastPositionRef.current = { x, y };
      
      updateCursorPosition(
        canvasId,
        userId,
        x,
        y,
        displayName,
        userColorRef.current
      );
    } else if (movedEnough && !throttleTimerRef.current) {
      // Schedule an update for later if we're throttled but moved significantly
      throttleTimerRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        lastPositionRef.current = { x, y };
        
        updateCursorPosition(
          canvasId,
          userId,
          x,
          y,
          displayName,
          userColorRef.current
        );
        
        throttleTimerRef.current = null;
      }, CURSOR_UPDATE_THROTTLE_MS - timeSinceLastUpdate);
    }
  }, [canvasId, userId, displayName, enabled]);

  // Clean up throttle timer on unmount
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  return {
    cursors,
    updateCursor,
    userColor: userColorRef.current,
  };
};

