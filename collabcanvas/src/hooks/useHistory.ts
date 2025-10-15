import { useHistoryContext } from '../contexts/HistoryContext';

/**
 * Hook for accessing history (undo/redo) functionality
 * 
 * @returns History context with recordAction, undo, redo, and availability flags
 */
export const useHistory = () => {
  return useHistoryContext();
};

