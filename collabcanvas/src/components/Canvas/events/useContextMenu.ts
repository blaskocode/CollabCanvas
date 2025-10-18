/**
 * @fileoverview Context menu event handler for shapes
 * Manages right-click context menu positioning and state
 */

import { useState, useCallback } from 'react';
import type Konva from 'konva';

export interface ContextMenuState {
  x: number;
  y: number;
  shapeId: string;
}

export interface UseContextMenuReturn {
  contextMenu: ContextMenuState | null;
  handleShapeContextMenu: (e: any, shapeId: string) => void;
  closeContextMenu: () => void;
}

export interface UseContextMenuProps {
  stageRef: React.RefObject<Konva.Stage | null> | null;
}

/**
 * @description Hook for managing right-click context menu on shapes
 * Handles positioning relative to stage coordinates
 */
export const useContextMenu = ({ stageRef }: UseContextMenuProps): UseContextMenuReturn => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  /**
   * Handle right-click on shape
   */
  const handleShapeContextMenu = useCallback((e: any, shapeId: string) => {
    e.evt.preventDefault();
    const stage = stageRef?.current;
    if (!stage) return;

    // Get pointer position on stage
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) {
      console.error('Failed to get pointer position for context menu');
      return;
    }

    // Show context menu at cursor position
    setContextMenu({
      x: pointerPos.x,
      y: pointerPos.y,
      shapeId,
    });
  }, [stageRef]);

  /**
   * Close context menu
   */
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    handleShapeContextMenu,
    closeContextMenu,
  };
};

