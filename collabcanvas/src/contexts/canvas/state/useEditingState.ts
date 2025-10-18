/**
 * @fileoverview Inline text editing state management
 * Tracks which shape is being edited and provides lifecycle hooks
 */

import { useState, useCallback } from 'react';

export interface EditingState {
  editingShapeId: string | null;
  isEditing: boolean;
}

export interface EditingActions {
  startEditing: (shapeId: string) => void;
  stopEditing: () => void;
  setEditingShapeId: (shapeId: string | null) => void;
}

export type UseEditingStateReturn = EditingState & EditingActions;

/**
 * @description Manages inline text editor state for shapes
 * Provides lifecycle hooks for starting and stopping edit mode
 */
export const useEditingState = (): UseEditingStateReturn => {
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);

  const isEditing = editingShapeId !== null;

  /**
   * Start editing a shape
   */
  const startEditing = useCallback((shapeId: string): void => {
    setEditingShapeId(shapeId);
  }, []);

  /**
   * Stop editing (close the editor)
   */
  const stopEditing = useCallback((): void => {
    setEditingShapeId(null);
  }, []);

  return {
    editingShapeId,
    isEditing,
    startEditing,
    stopEditing,
    setEditingShapeId,
  };
};

