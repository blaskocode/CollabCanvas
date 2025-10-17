import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ClipboardData } from '../utils/clipboard';

interface ClipboardContextType {
  clipboardData: ClipboardData | null;
  setClipboardData: (data: ClipboardData | null) => void;
  incrementPasteCount: () => void;
  resetPasteCount: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

/**
 * ClipboardProvider component
 * Manages clipboard state for copy/cut/paste operations
 */
export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clipboardData, setClipboardDataState] = useState<ClipboardData | null>(null);

  const setClipboardData = useCallback((data: ClipboardData | null) => {
    setClipboardDataState(data);
  }, []);

  const incrementPasteCount = useCallback(() => {
    setClipboardDataState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pasteCount: prev.pasteCount + 1,
      };
    });
  }, []);

  const resetPasteCount = useCallback(() => {
    setClipboardDataState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pasteCount: 0,
      };
    });
  }, []);

  return (
    <ClipboardContext.Provider
      value={{
        clipboardData,
        setClipboardData,
        incrementPasteCount,
        resetPasteCount,
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};

/**
 * Hook to access clipboard context
 */
export const useClipboard = (): ClipboardContextType => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within ClipboardProvider');
  }
  return context;
};

