/**
 * Canvas export utilities for PNG and SVG export
 */

import type Konva from 'konva';

export type ExportFormat = 'png' | 'svg';
export type ExportType = 'fullCanvas' | 'visibleArea' | 'selection';

export interface ExportOptions {
  format: ExportFormat;
  exportType: ExportType;
  quality?: number; // PNG quality (0-1, default 1)
  scale?: number; // Export scale multiplier (default 1)
  selectedShapeIds?: string[]; // For selection export
}

/**
 * Generate filename with timestamp
 */
export function getExportFilename(format: ExportFormat, exportType: ExportType): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const typeLabel = exportType === 'fullCanvas' ? 'canvas' : exportType === 'visibleArea' ? 'viewport' : 'selection';
  return `collabcanvas-${typeLabel}-${timestamp}.${format}`;
}

/**
 * Download file from data URL
 */
export function downloadFile(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export canvas as PNG
 * 
 * @param stage - Konva stage instance
 * @param options - Export options
 * @returns Data URL of the exported PNG
 */
export function exportCanvasToPNG(
  stage: Konva.Stage,
  options: Omit<ExportOptions, 'format'>
): string {
  const { exportType, quality = 1, scale = 2, selectedShapeIds = [] } = options;

  // Save current stage state
  const originalX = stage.x();
  const originalY = stage.y();
  const originalScaleX = stage.scaleX();
  const originalScaleY = stage.scaleY();
  const originalWidth = stage.width();
  const originalHeight = stage.height();

  try {
    if (exportType === 'fullCanvas') {
      // For full canvas export, we need to:
      // 1. Reset position and scale
      // 2. Temporarily resize stage to fit entire canvas
      // 3. Export
      // 4. Restore original dimensions
      
      stage.x(0);
      stage.y(0);
      stage.scale({ x: 1, y: 1 });
      stage.width(5000);  // Full canvas width
      stage.height(5000); // Full canvas height
      
      // Export to data URL with the full canvas visible
      const dataUrl = stage.toDataURL({
        pixelRatio: scale,
        quality,
        mimeType: 'image/png',
      });
      
      return dataUrl;
    } else if (exportType === 'visibleArea') {
      // Keep current viewport as is - export what's visible
      const dataUrl = stage.toDataURL({
        pixelRatio: scale,
        quality,
        mimeType: 'image/png',
      });
      
      return dataUrl;
    } else if (exportType === 'selection' && selectedShapeIds.length > 0) {
      // Find the bounding box of selected shapes
      const layer = stage.getLayers()[0];
      if (!layer) {
        throw new Error('No layer found on stage');
      }

      // Get all selected shape nodes
      const selectedNodes = selectedShapeIds
        .map(id => layer.findOne(`#${id}`))
        .filter((node): node is NonNullable<typeof node> => node !== null);

      if (selectedNodes.length === 0) {
        throw new Error('Selected shapes not found');
      }

      // Hide transformer/selection indicators
      const transformer = layer.findOne('Transformer');
      const transformerWasVisible = transformer?.visible();
      if (transformer) {
        transformer.visible(false);
      }

      // Store original stroke properties and temporarily remove selection styling
      const originalStrokes = new Map<Konva.Node, { stroke: string | undefined; strokeWidth: number | undefined }>();
      
      selectedNodes.forEach(node => {
        const currentStroke = node.getAttr('stroke');
        const currentStrokeWidth = node.getAttr('strokeWidth');
        
        // Save original values
        originalStrokes.set(node, { 
          stroke: currentStroke, 
          strokeWidth: currentStrokeWidth 
        });
        
        // Remove selection stroke (blue #2563eb)
        if (currentStroke === '#2563eb' || currentStroke === 'rgb(37, 99, 235)') {
          // If it's the selection blue, remove it or set to transparent
          // Check if the shape has a data attribute for original stroke
          const originalStroke = node.getAttr('data-original-stroke');
          if (originalStroke) {
            node.setAttr('stroke', originalStroke);
          } else {
            // If no original stroke, remove it entirely
            node.setAttr('stroke', undefined);
            node.setAttr('strokeWidth', 0);
          }
        }
      });

      // Get all shapes in the layer and hide non-selected ones
      const allShapes = layer.getChildren();
      const hiddenShapes: Konva.Node[] = [];
      
      allShapes.forEach(node => {
        // Skip the transformer itself
        if (node.getClassName() === 'Transformer') return;
        
        // If this shape is not in the selected list, hide it
        const nodeId = node.id();
        if (nodeId && !selectedShapeIds.includes(nodeId) && node.visible()) {
          hiddenShapes.push(node);
          node.visible(false);
        }
      });

      // Redraw layer to apply stroke changes
      layer.batchDraw();

      // Calculate bounding box with padding
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      selectedNodes.forEach(node => {
        const box = node.getClientRect();
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      });

      // Add padding (20px on each side)
      const padding = 20;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const width = maxX - minX;
      const height = maxY - minY;

      // Export only the selection region (without selection indicators or other shapes)
      const dataUrl = stage.toDataURL({
        pixelRatio: scale,
        quality,
        mimeType: 'image/png',
        x: minX,
        y: minY,
        width: width,
        height: height,
      });

      // Restore original stroke properties for selected shapes
      originalStrokes.forEach((original, node) => {
        if (original.stroke !== undefined) {
          node.setAttr('stroke', original.stroke);
        }
        if (original.strokeWidth !== undefined) {
          node.setAttr('strokeWidth', original.strokeWidth);
        }
      });

      // Restore visibility of hidden shapes
      hiddenShapes.forEach(node => {
        node.visible(true);
      });

      // Restore transformer visibility
      if (transformer && transformerWasVisible) {
        transformer.visible(true);
      }

      // Redraw the layer to ensure everything is restored
      layer.batchDraw();

      return dataUrl;
    } else {
      // Fallback to visible area
      const dataUrl = stage.toDataURL({
        pixelRatio: scale,
        quality,
        mimeType: 'image/png',
      });
      
      return dataUrl;
    }
  } finally {
    // Restore original stage state
    stage.x(originalX);
    stage.y(originalY);
    stage.scale({ x: originalScaleX, y: originalScaleY });
    stage.width(originalWidth);
    stage.height(originalHeight);
  }
}

/**
 * Export canvas as SVG
 * Note: Konva doesn't have native SVG export, so this is a placeholder
 * In a real implementation, you would use a library like konva-to-svg
 * or manually generate SVG from the shape data
 * 
 * @param stage - Konva stage instance
 * @param options - Export options
 * @returns SVG string or data URL
 */
export function exportCanvasToSVG(
  stage: Konva.Stage,
  options: Omit<ExportOptions, 'format'>
): string {
  // This is a simplified placeholder
  // For full SVG export, consider using konva-node or manual SVG generation
  
  console.warn('SVG export is not fully implemented. Exporting as PNG instead.');
  return exportCanvasToPNG(stage, options);
}

/**
 * Export canvas with specified format and type
 * 
 * @param stage - Konva stage instance
 * @param options - Export options
 */
export function exportCanvas(stage: Konva.Stage, options: ExportOptions): void {
  const { format, ...exportOptions } = options;
  
  let dataUrl: string;
  
  if (format === 'png') {
    dataUrl = exportCanvasToPNG(stage, exportOptions);
  } else if (format === 'svg') {
    dataUrl = exportCanvasToSVG(stage, exportOptions);
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
  
  const filename = getExportFilename(format, options.exportType);
  downloadFile(dataUrl, filename);
}

