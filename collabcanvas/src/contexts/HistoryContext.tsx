import React, { createContext, useContext, useState, useCallback } from 'react';
import type { HistoryStack, HistoryAction } from '../utils/history';
import { 
  createEmptyHistory, 
  canUndo as checkCanUndo,
  canRedo as checkCanRedo,
  addAction,
  moveBack,
  moveForward,
  getCurrentAction,
  getNextAction
} from '../utils/history';

interface HistoryContextType {
  /** Record a new action in history */
  recordAction: (action: HistoryAction) => void;
  
  /** Undo the last action */
  undo: () => HistoryAction | null;
  
  /** Redo the next action */
  redo: () => HistoryAction | null;
  
  /** Check if undo is available */
  canUndo: boolean;
  
  /** Check if redo is available */
  canRedo: boolean;
  
  /** Clear all history */
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

/**
 * HistoryProvider component
 * Manages the undo/redo history stack for canvas operations
 */
export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryStack>(createEmptyHistory());

  /**
   * Record a new action in the history stack
   * This will clear any redo history
   */
  const recordAction = useCallback((action: HistoryAction) => {
    setHistory((prev) => addAction(prev, action));
  }, []);

  /**
   * Undo the last action
   * Returns the action that was undone, or null if nothing to undo
   */
  const undo = useCallback((): HistoryAction | null => {
    const action = getCurrentAction(history);
    if (action) {
      setHistory((prev) => moveBack(prev));
    }
    return action;
  }, [history]);

  /**
   * Redo the next action
   * Returns the action that was redone, or null if nothing to redo
   */
  const redo = useCallback((): HistoryAction | null => {
    const action = getNextAction(history);
    if (action) {
      setHistory((prev) => moveForward(prev));
    }
    return action;
  }, [history]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory(createEmptyHistory());
  }, []);

  const value: HistoryContextType = {
    recordAction,
    undo,
    redo,
    canUndo: checkCanUndo(history),
    canRedo: checkCanRedo(history),
    clearHistory,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

/**
 * Hook to use the History context
 * Throws an error if used outside of HistoryProvider
 */
export const useHistoryContext = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistoryContext must be used within a HistoryProvider');
  }
  return context;
};

