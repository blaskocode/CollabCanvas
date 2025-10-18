/**
 * @fileoverview Thin canvas provider composing domain-specific state hooks
 * Provides unified context for canvas operations without centralized state logic
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCanvas } from '../../hooks/useCanvas';
import { useSelectionState } from './state/useSelectionState';
import { useSnappingState } from './state/useSnappingState';
import { useEditingState } from './state/useEditingState';
import { useViewportState } from './state/useViewportState';
import { useConnectionsState } from './state/useConnectionsState';
import { useShapesState } from './state/useShapesState';
import type { CanvasContextType } from '../../utils/types';

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

/**
 * @description CanvasProvider composes domain hooks and exposes stable context value
 * Each domain hook manages its own state slice independently
 */
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();

  // Viewport state (pan/zoom)
  const viewportState = useViewportState();

  // Selection state
  const selectionState = useSelectionState();

  // Snapping state (grid/guides)
  const snappingState = useSnappingState();

  // Get connections from Firestore
  const { connections: connectionsFromFirestore } = useCanvas(
    currentUser?.uid || 'anonymous',
    !authLoading
  );

  // Connections state with optimistic updates
  const connectionsState = useConnectionsState({
    connectionsFromFirestore,
    currentUserId: currentUser?.uid || null,
    onSelectConnection: selectionState.selectConnection,
  });

  // Shapes state (largest domain hook)
  const shapesState = useShapesState({
    currentUserId: currentUser?.uid || null,
    authLoading,
    selectedIds: selectionState.selectedIds,
    onClearSelection: selectionState.clearSelection,
    onSelectMultiple: selectionState.selectMultipleShapes,
  });

  // Memoize the context value to prevent unnecessary re-renders
  const value: CanvasContextType = useMemo(() => ({
    // Shapes & groups
    shapes: shapesState.shapes,
    groups: shapesState.groups,
    loading: shapesState.loading,
    
    // Selection
    selectedId: selectionState.selectedId,
    selectedIds: selectionState.selectedIds,
    selectedConnectionId: connectionsState.selectedConnectionId,
    selectShape: selectionState.selectShape,
    selectMultipleShapes: selectionState.selectMultipleShapes,
    isSelected: selectionState.isSelected,
    
    // Viewport
    stageRef: viewportState.stageRef,
    
    // Shape CRUD
    addShape: shapesState.addShape,
    updateShape: shapesState.updateShape,
    deleteShape: shapesState.deleteShape,
    deleteMultipleShapes: shapesState.deleteMultipleShapes,
    duplicateShape: shapesState.duplicateShape,
    
    // Arrow key movement
    moveShapesByArrowKey: shapesState.moveShapesByArrowKey,
    saveArrowKeyMovementToHistory: shapesState.saveArrowKeyMovementToHistory,
    
    // Shape locking
    lockShape: shapesState.lockShape,
    unlockShape: shapesState.unlockShape,
    
    // Z-index
    bringForward: shapesState.bringForward,
    sendBack: shapesState.sendBack,
    
    // Alignment & distribution
    alignShapes: shapesState.alignShapes,
    distributeShapes: shapesState.distributeShapes,
    
    // Groups
    groupShapes: shapesState.groupShapes,
    ungroupShapes: shapesState.ungroupShapes,
    deleteGroup: shapesState.deleteGroup,
    updateGroupStyle: shapesState.updateGroupStyle,
    updateGroupBounds: shapesState.updateGroupBounds,
    duplicateGroup: shapesState.duplicateGroup,
    getGroupShapes: shapesState.getGroupShapes,
    
    // Connections
    connections: connectionsState.connections,
    addConnection: (data) => connectionsState.addConnection(data, currentUser?.uid || '', undefined),
    updateConnection: (id, updates) => connectionsState.updateConnection(id, updates, currentUser?.uid || ''),
    deleteConnection: connectionsState.deleteConnection,
    selectConnection: connectionsState.selectConnection,
    getShapeConnections: connectionsState.getShapeConnections,
    
    // History
    undo: shapesState.undo,
    redo: shapesState.redo,
    canUndo: shapesState.canUndo,
    canRedo: shapesState.canRedo,
    
    // Canvas operations
    clearAll: shapesState.clearAll,
    
    // Clipboard
    copyShapes: shapesState.copyShapes,
    cutShapes: shapesState.cutShapes,
    pasteShapes: () => shapesState.pasteShapes(viewportState.stageRef),
    hasClipboardData: shapesState.hasClipboardData,
    
    // Export
    exportCanvas: (format, exportType) => shapesState.exportCanvas(format, exportType, viewportState.stageRef, selectionState.selectedIds),
    
    // Grid/snapping
    gridEnabled: snappingState.gridEnabled,
    toggleGrid: snappingState.toggleGrid,
    
    // Selection utilities
    selectShapesByType: (type) => shapesState.selectShapesByType(type, selectionState.selectMultipleShapes),
    selectShapesInLasso: (polygon) => shapesState.selectShapesInLasso(polygon, selectionState.selectMultipleShapes),
    
    // Components
    createComponent: (name, description) => shapesState.createComponent(name, selectionState.selectedIds, description),
    deleteComponent: shapesState.deleteComponent,
    updateComponent: shapesState.updateComponent,
    insertComponent: (id, position) => shapesState.insertComponent(id, viewportState.stageRef, selectionState.selectMultipleShapes, position),
    components: shapesState.components,
    
    // Comments
    createComment: shapesState.createComment,
    updateComment: shapesState.updateComment,
    deleteComment: shapesState.deleteComment,
    resolveComment: shapesState.resolveComment,
    unresolveComment: shapesState.unresolveComment,
    comments: shapesState.comments,
    getShapeComments: shapesState.getShapeComments,
    getShapeCommentCount: shapesState.getShapeCommentCount,
    getShapeUnresolvedCommentCount: shapesState.getShapeUnresolvedCommentCount,
  }), [
    shapesState,
    selectionState,
    connectionsState,
    snappingState,
    viewportState,
    currentUser,
  ]);

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};

/**
 * @description Hook to use the Canvas context
 * Throws an error if used outside of CanvasProvider
 */
export const useCanvasContext = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

