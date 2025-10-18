/**
 * @fileoverview Stage mouse event handlers for selection, drawing, and panning
 * Handles box selection, lasso selection, drawing mode, placement mode, and Space-key panning
 */

import { useState, useRef, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ShapeType } from '../../../utils/types';

export interface MouseEventsState {
  // Box selection
  isBoxSelecting: boolean;
  boxSelect: { x1: number; y1: number; x2: number; y2: number } | null;
  
  // Lasso selection
  isLassoDrawing: boolean;
  lassoPath: Array<{ x: number; y: number }>;
  
  // Drawing mode
  isDrawingMode: boolean;
  drawingShapeType: ShapeType | null;
  drawingPreview: { x: number; y: number; width: number; height: number } | null;
  
  // Placement mode
  isPlacementMode: boolean;
  placementShapeType: ShapeType | null;
  placementPreview: { x: number; y: number } | null;
  
  // Panning
  isPanning: boolean;
  isSpacePressed: boolean;
  
  // Selection mode
  selectionMode: 'box' | 'lasso';
}

export interface MouseEventsActions {
  // Box/Lasso selection
  setSelectionMode: (mode: 'box' | 'lasso') => void;
  
  // Drawing mode
  enterDrawingMode: (shapeType: ShapeType) => void;
  exitDrawingMode: () => void;
  
  // Placement mode
  enterPlacementMode: (shapeType: ShapeType) => void;
  exitPlacementMode: () => void;
  
  // Space key panning
  setIsSpacePressed: (pressed: boolean) => void;
  
  // Stage mouse handlers
  handleStageMouseDown: (e: KonvaEventObject<MouseEvent>) => Promise<void>;
  handleStageMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  handleStageMouseUp: () => Promise<void>;
}

export type UseMouseEventsReturn = MouseEventsState & MouseEventsActions;

export interface UseMouseEventsProps {
  shapes: any[];
  defaultWorkflowShapeSizes: Record<string, { width: number; height: number }>;
  addShape: (type: ShapeType, position: { x: number; y: number }, props?: any) => Promise<string>;
  selectShapesInLasso: (path: Array<{ x: number; y: number }>) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  isDraggingShapeRef: React.RefObject<boolean>;
  onLassoComplete?: () => void;
}

/**
 * @description Hook for stage mouse events including selection, drawing, and panning
 * Manages box selection, lasso selection, drawing mode, placement mode, and Space-key panning
 */
export const useMouseEvents = ({
  shapes,
  defaultWorkflowShapeSizes,
  addShape,
  selectShapesInLasso,
  setStagePos,
  isDraggingShapeRef,
  onLassoComplete,
}: UseMouseEventsProps): UseMouseEventsReturn => {
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState<'box' | 'lasso'>('box');
  
  // Box selection state
  const [boxSelect, setBoxSelect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  
  // Lasso selection state
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);
  const [lassoPath, setLassoPath] = useState<Array<{ x: number; y: number }>>([]);
  
  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingShapeType, setDrawingShapeType] = useState<ShapeType | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const drawingStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Placement mode state
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [placementShapeType, setPlacementShapeType] = useState<ShapeType | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{ x: number; y: number } | null>(null);
  
  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);

  /**
   * Enter drawing mode
   */
  const enterDrawingMode = useCallback((shapeType: ShapeType) => {
    setIsDrawingMode(true);
    setDrawingShapeType(shapeType);
    setDrawingPreview(null);
    drawingStartRef.current = null;
  }, []);

  /**
   * Exit drawing mode
   */
  const exitDrawingMode = useCallback(() => {
    setIsDrawingMode(false);
    setDrawingShapeType(null);
    setDrawingPreview(null);
    drawingStartRef.current = null;
  }, []);

  /**
   * Enter placement mode
   */
  const enterPlacementMode = useCallback((shapeType: ShapeType) => {
    setIsPlacementMode(true);
    setPlacementShapeType(shapeType);
    setPlacementPreview(null);
  }, []);

  /**
   * Exit placement mode
   */
  const exitPlacementMode = useCallback(() => {
    setIsPlacementMode(false);
    setPlacementShapeType(null);
    setPlacementPreview(null);
  }, []);

  /**
   * Handle stage mouse down
   */
  const handleStageMouseDown = useCallback(async (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const canvasX = (pos.x - stage.x()) / stage.scaleX();
    const canvasY = (pos.y - stage.y()) / stage.scaleY();
    
    // Handle placement mode FIRST (click-to-place workflow shapes)
    if (isPlacementMode && placementShapeType && placementPreview && e.evt.button === 0) {
      const shapeSize = defaultWorkflowShapeSizes[placementShapeType] || { width: 120, height: 80 };
      
      // Calculate highest z-index to place new shape on top
      const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
      const newZIndex = maxZIndex + 1;
      
      // Place shape at the preview position
      await addShape(
        placementShapeType, 
        { x: placementPreview.x, y: placementPreview.y }, 
        { 
          width: shapeSize.width, 
          height: shapeSize.height,
          text: placementShapeType.charAt(0).toUpperCase() + placementShapeType.slice(1),
          zIndex: newZIndex
        }
      );
      
      exitPlacementMode();
      return;
    }
    
    // Handle drawing mode SECOND (drag to create shapes)
    if (isDrawingMode && drawingShapeType && e.evt.button === 0) {
      drawingStartRef.current = { x: canvasX, y: canvasY };
      setDrawingPreview({ x: canvasX, y: canvasY, width: 0, height: 0 });
      return;
    }
    
    // Only proceed with selection/panning if clicked on empty space
    const clickedOnEmpty = e.target === stage;
    if (!clickedOnEmpty) return;
    
    // Start panning if Space is pressed
    if (isSpacePressed && !isDraggingShapeRef.current) {
      setIsPanning(true);
      panStartRef.current = {
        x: pos.x,
        y: pos.y,
        stageX: stage.x(),
        stageY: stage.y(),
      };
      return;
    }
    
    // Start selection based on active mode
    if (e.evt.button === 0) {
      if (selectionMode === 'lasso') {
        if (!isLassoDrawing) {
          // First click: start lasso
          setIsLassoDrawing(true);
          setLassoPath([{ x: canvasX, y: canvasY }]);
        } else {
          // Second click: complete lasso selection
          if (lassoPath.length > 2) {
            selectShapesInLasso(lassoPath);
            onLassoComplete?.(); // Notify parent that lasso completed
          }
          setIsLassoDrawing(false);
          setLassoPath([]);
        }
      } else {
        setIsBoxSelecting(true);
        setBoxSelect({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
      }
    }
  }, [
    isPlacementMode,
    placementShapeType,
    placementPreview,
    isDrawingMode,
    drawingShapeType,
    isSpacePressed,
    isDraggingShapeRef,
    selectionMode,
    isLassoDrawing,
    lassoPath,
    shapes,
    defaultWorkflowShapeSizes,
    addShape,
    selectShapesInLasso,
    exitPlacementMode,
  ]);

  /**
   * Handle stage mouse move
   */
  const handleStageMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    const canvasX = (pos.x - stage.x()) / stage.scaleX();
    const canvasY = (pos.y - stage.y()) / stage.scaleY();
    
    // Handle placement preview (ghost shape follows cursor)
    if (isPlacementMode && placementShapeType) {
      const shapeSize = defaultWorkflowShapeSizes[placementShapeType] || { width: 120, height: 80 };
      setPlacementPreview({ 
        x: canvasX - shapeSize.width / 2, 
        y: canvasY - shapeSize.height / 2 
      });
      return;
    }
    
    // Handle drawing preview
    if (isDrawingMode && drawingStartRef.current) {
      const start = drawingStartRef.current;
      const width = canvasX - start.x;
      const height = canvasY - start.y;
      setDrawingPreview({ x: start.x, y: start.y, width, height });
      return;
    }
    
    // Handle lasso drawing
    if (isLassoDrawing && selectionMode === 'lasso') {
      setLassoPath(prev => {
        if (prev.length === 0) return prev;
        
        const lastPoint = prev[prev.length - 1];
        const dx = canvasX - lastPoint.x;
        const dy = canvasY - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= 5) {
          return [...prev, { x: canvasX, y: canvasY }];
        }
        return prev;
      });
      return;
    }
    
    // Handle panning
    if (isPanning && panStartRef.current && !isDraggingShapeRef.current) {
      const dx = pos.x - panStartRef.current.x;
      const dy = pos.y - panStartRef.current.y;
      
      const newX = panStartRef.current.stageX + dx;
      const newY = panStartRef.current.stageY + dy;
      
      stage.position({ x: newX, y: newY });
      setStagePos({ x: newX, y: newY });
      return;
    }
    
    // Handle box selection
    if (isBoxSelecting && boxSelect) {
      setBoxSelect({ ...boxSelect, x2: canvasX, y2: canvasY });
    }
  }, [
    isPlacementMode,
    placementShapeType,
    isDrawingMode,
    isLassoDrawing,
    selectionMode,
    isPanning,
    isDraggingShapeRef,
    isBoxSelecting,
    boxSelect,
    defaultWorkflowShapeSizes,
    setStagePos,
  ]);

  /**
   * Handle stage mouse up
   */
  const handleStageMouseUp = useCallback(async () => {
    // Handle drawing completion
    if (isDrawingMode && drawingStartRef.current && drawingPreview && drawingShapeType) {
      const { x, y, width, height } = drawingPreview;
      
      // Only create shape if it has meaningful size (at least 5px)
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        // Normalize coordinates
        const normalizedX = width < 0 ? x + width : x;
        const normalizedY = height < 0 ? y + height : y;
        const normalizedWidth = Math.abs(width);
        const normalizedHeight = Math.abs(height);
        
        const maxZIndex = Math.max(...shapes.map(s => s.zIndex || 0), 0);
        const newZIndex = maxZIndex + 1;
        
        const shapeType = drawingShapeType;
        
        // Create shape based on type
        if (shapeType === 'circle') {
          const radius = Math.min(normalizedWidth, normalizedHeight) / 2;
          const centerX = normalizedX + radius;
          const centerY = normalizedY + radius;
          await addShape(shapeType, { x: centerX, y: centerY }, { 
            radius, 
            width: radius * 2, 
            height: radius * 2,
            zIndex: newZIndex 
          });
        } else if (shapeType === 'line') {
          await addShape(shapeType, { x: x, y: y }, { 
            points: [0, 0, width, height] as [number, number, number, number],
            width: normalizedWidth,
            height: normalizedHeight,
            zIndex: newZIndex 
          });
        } else {
          // Rectangle, text, and other shapes
          await addShape(shapeType, { x: normalizedX, y: normalizedY }, { 
            width: normalizedWidth, 
            height: normalizedHeight,
            zIndex: newZIndex 
          });
        }
      }
      
      // Reset drawing state
      drawingStartRef.current = null;
      setDrawingPreview(null);
    }
    
    // End box selection (actual selection happens in parent)
    setIsBoxSelecting(false);
    setBoxSelect(null); // Clear the box visual
    
    // End panning
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  }, [
    isDrawingMode,
    drawingPreview,
    drawingShapeType,
    isPanning,
    shapes,
    addShape,
  ]);

  return {
    // State
    isBoxSelecting,
    boxSelect,
    isLassoDrawing,
    lassoPath,
    isDrawingMode,
    drawingShapeType,
    drawingPreview,
    isPlacementMode,
    placementShapeType,
    placementPreview,
    isPanning,
    isSpacePressed,
    selectionMode,
    
    // Actions
    setSelectionMode,
    enterDrawingMode,
    exitDrawingMode,
    enterPlacementMode,
    exitPlacementMode,
    setIsSpacePressed,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
  };
};

