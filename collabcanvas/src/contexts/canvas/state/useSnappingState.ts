/**
 * @fileoverview Snapping state management for grid and smart guides
 * Handles grid toggle and computed alignment guides
 */

import { useState, useCallback } from 'react';

export interface SnappingState {
  gridEnabled: boolean;
}

export interface SnappingActions {
  toggleGrid: () => void;
  setGridEnabled: (enabled: boolean) => void;
}

export type UseSnappingStateReturn = SnappingState & SnappingActions;

/**
 * @description Manages grid snapping and smart guides state
 * Grid state persists to localStorage
 */
export const useSnappingState = (): UseSnappingStateReturn => {
  // Grid snapping - Load from localStorage or default to true
  const [gridEnabled, setGridEnabledState] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-grid-enabled');
    return saved !== null ? saved === 'true' : true; // Default to true
  });

  /**
   * Toggle grid snapping on/off
   */
  const toggleGrid = useCallback((): void => {
    setGridEnabledState(prev => {
      const newValue = !prev;
      localStorage.setItem('collabcanvas-grid-enabled', String(newValue));
      return newValue;
    });
  }, []);

  /**
   * Set grid enabled state directly
   */
  const setGridEnabled = useCallback((enabled: boolean): void => {
    setGridEnabledState(enabled);
    localStorage.setItem('collabcanvas-grid-enabled', String(enabled));
  }, []);

  return {
    gridEnabled,
    toggleGrid,
    setGridEnabled,
  };
};

