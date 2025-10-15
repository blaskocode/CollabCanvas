/**
 * History utilities for undo/redo functionality
 * Tracks user actions on the canvas for undo/redo operations
 */

import type { Shape } from './types';

/**
 * Types of actions that can be recorded in history
 */
export type HistoryActionType = 
  | 'create'      // Shape created
  | 'delete'      // Shape deleted
  | 'update'      // Shape properties updated (position, size, style, transform)
  | 'move'        // Shape moved (position change)
  | 'resize'      // Shape resized
  | 'rotate'      // Shape rotated
  | 'style'       // Shape styling changed
  | 'transform';  // Shape transformed (scale, rotation)

/**
 * A recorded action in the history stack
 */
export interface HistoryAction {
  /** Type of action performed */
  type: HistoryActionType;
  
  /** IDs of shapes affected by this action */
  shapesAffected: string[];
  
  /** State of shapes before the action */
  before: Record<string, Partial<Shape>>;
  
  /** State of shapes after the action */
  after: Record<string, Partial<Shape>>;
  
  /** When the action occurred */
  timestamp: number;
  
  /** User who performed the action */
  userId: string;
}

/**
 * The history stack containing all recorded actions
 */
export interface HistoryStack {
  /** Array of recorded actions */
  actions: HistoryAction[];
  
  /** Current position in the history stack (for undo/redo navigation) */
  currentIndex: number;
}

/**
 * Maximum number of actions to keep in history
 */
export const MAX_HISTORY_SIZE = 50;

/**
 * Create an empty history stack
 */
export const createEmptyHistory = (): HistoryStack => ({
  actions: [],
  currentIndex: -1,
});

/**
 * Check if undo is available
 */
export const canUndo = (history: HistoryStack): boolean => {
  return history.currentIndex >= 0;
};

/**
 * Check if redo is available
 */
export const canRedo = (history: HistoryStack): boolean => {
  return history.currentIndex < history.actions.length - 1;
};

/**
 * Add an action to the history stack
 * This will remove any actions after the current index (clearing redo history)
 * and enforce the maximum history size
 */
export const addAction = (history: HistoryStack, action: HistoryAction): HistoryStack => {
  // Remove all actions after current index (clear redo stack)
  const newActions = history.actions.slice(0, history.currentIndex + 1);
  
  // Add the new action
  newActions.push(action);
  
  // Enforce maximum history size (remove oldest if needed)
  const trimmedActions = newActions.length > MAX_HISTORY_SIZE
    ? newActions.slice(newActions.length - MAX_HISTORY_SIZE)
    : newActions;
  
  return {
    actions: trimmedActions,
    currentIndex: trimmedActions.length - 1,
  };
};

/**
 * Move back one step in history (for undo)
 */
export const moveBack = (history: HistoryStack): HistoryStack => {
  if (!canUndo(history)) return history;
  
  return {
    ...history,
    currentIndex: history.currentIndex - 1,
  };
};

/**
 * Move forward one step in history (for redo)
 */
export const moveForward = (history: HistoryStack): HistoryStack => {
  if (!canRedo(history)) return history;
  
  return {
    ...history,
    currentIndex: history.currentIndex + 1,
  };
};

/**
 * Get the current action to undo
 */
export const getCurrentAction = (history: HistoryStack): HistoryAction | null => {
  if (!canUndo(history)) return null;
  return history.actions[history.currentIndex];
};

/**
 * Get the next action to redo
 */
export const getNextAction = (history: HistoryStack): HistoryAction | null => {
  if (!canRedo(history)) return null;
  return history.actions[history.currentIndex + 1];
};

