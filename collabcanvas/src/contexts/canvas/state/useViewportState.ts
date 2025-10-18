/**
 * @fileoverview Viewport state management for canvas pan/zoom
 * Manages stage position, scale, and viewport transforms
 */

import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import { MIN_ZOOM, MAX_ZOOM } from '../../../utils/constants';

export interface ViewportState {
  stagePos: { x: number; y: number };
  stageScale: number;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export interface ViewportActions {
  setStagePos: (pos: { x: number; y: number }) => void;
  setStageScale: (scale: number) => void;
  clampZoom: (scale: number) => number;
}

export type UseViewportStateReturn = ViewportState & ViewportActions;

/**
 * @description Manages viewport state for pan and zoom
 * Includes stage ref for Konva interactions
 */
export const useViewportState = (): UseViewportStateReturn => {
  const stageRef = useRef<Konva.Stage>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  /**
   * Clamp zoom level to min/max bounds
   */
  const clampZoom = useCallback((scale: number): number => {
    if (scale < MIN_ZOOM) return MIN_ZOOM;
    if (scale > MAX_ZOOM) return MAX_ZOOM;
    return scale;
  }, []);

  return {
    stagePos,
    stageScale,
    stageRef,
    setStagePos,
    setStageScale,
    clampZoom,
  };
};

