/**
 * @fileoverview Wheel zoom event handler for canvas viewport
 * Handles mouse wheel zoom with cursor-based zoom point
 */

import { useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../../../utils/constants';

export interface UseWheelZoomProps {
  stageRef: React.RefObject<Konva.Stage | null> | null;
  setStagePos: (pos: { x: number; y: number }) => void;
  setStageScale: (scale: number) => void;
  dimensions: { width: number; height: number };
}

export interface UseWheelZoomReturn {
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

/**
 * @description Hook for wheel-based zoom with viewport clamping
 * Zooms toward cursor position on wheel events
 * Zooms toward viewport center on button clicks
 */
export const useWheelZoom = ({
  stageRef,
  setStagePos,
  setStageScale,
  dimensions,
}: UseWheelZoomProps): UseWheelZoomReturn => {
  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate zoom direction and amount
    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    // Calculate new scale
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Constrain zoom to min/max
    if (newScale < MIN_ZOOM) newScale = MIN_ZOOM;
    if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

    setStageScale(newScale);

    // Calculate new position to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStagePos(newPos);
  }, [setStagePos, setStageScale]);

  /**
   * Handle zoom in button click
   */
  const handleZoomIn = useCallback(() => {
    const stage = stageRef?.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    let newScale = oldScale + ZOOM_STEP;
    if (newScale > MAX_ZOOM) newScale = MAX_ZOOM;

    // Zoom toward center of viewport
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageRef, dimensions, setStageScale, setStagePos]);

  /**
   * Handle zoom out button click
   */
  const handleZoomOut = useCallback(() => {
    const stage = stageRef?.current;
    if (!stage) return;
    
    const oldScale = stage.scaleX();
    let newScale = oldScale - ZOOM_STEP;
    if (newScale < MIN_ZOOM) newScale = MIN_ZOOM;

    // Zoom toward center of viewport
    const center = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageRef, dimensions, setStageScale, setStagePos]);

  /**
   * Handle zoom reset (fit to viewport)
   */
  const handleZoomReset = useCallback(() => {
    // Reset to 100% zoom centered
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  }, [setStageScale, setStagePos]);

  return {
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  };
};

