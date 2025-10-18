/**
 * @fileoverview Selection state management for canvas shapes and connections
 * Handles single, multi-select, and connection selection without Firestore coupling
 */

import { useState, useCallback } from 'react';

export interface SelectionState {
  selectedIds: string[];
  selectedConnectionId: string | null;
  selectedId: string | null; // Backward compatibility: first selected shape
}

export interface SelectionActions {
  selectShape: (id: string | null, options?: { shift?: boolean }) => void;
  selectMultipleShapes: (ids: string[]) => void;
  selectConnection: (id: string | null) => void;
  isSelected: (id: string) => boolean;
  clearSelection: () => void;
}

export type UseSelectionStateReturn = SelectionState & SelectionActions;

/**
 * @description Manages selection state for shapes and connections
 * Supports single, multi-select (with Shift), and connection selection
 */
export const useSelectionState = (): UseSelectionStateReturn => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Backward compatibility: selectedId is the first selected shape (or null)
  const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;

  /**
   * Select or deselect a shape
   * Supports multi-select with Shift key
   */
  const selectShape = useCallback((id: string | null, options?: { shift?: boolean }): void => {
    if (id === null) {
      // Deselect all
      setSelectedIds([]);
      setSelectedConnectionId(null);
      return;
    }

    // Deselect any selected connection when selecting a shape
    setSelectedConnectionId(null);

    if (options?.shift) {
      // Shift+click: toggle shape in selection
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
      );
    } else {
      // Normal click: select only this shape
      setSelectedIds([id]);
    }
  }, []);

  /**
   * Select multiple shapes at once
   * Used for box selection to avoid state batching issues
   */
  const selectMultipleShapes = useCallback((ids: string[]): void => {
    // Deselect any selected connection when selecting shapes
    setSelectedConnectionId(null);
    setSelectedIds(ids);
  }, []);

  /**
   * Select a connection
   */
  const selectConnection = useCallback((id: string | null): void => {
    setSelectedConnectionId(id);
    // Deselect shapes when selecting a connection
    if (id !== null) {
      setSelectedIds([]);
    }
  }, []);

  /**
   * Check if a shape is currently selected
   */
  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback((): void => {
    setSelectedIds([]);
    setSelectedConnectionId(null);
  }, []);

  return {
    selectedIds,
    selectedConnectionId,
    selectedId,
    selectShape,
    selectMultipleShapes,
    selectConnection,
    isSelected,
    clearSelection,
  };
};

