import React from 'react';
import { Line } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, GRID_COLOR, GRID_OPACITY } from '../../utils/constants';

interface GridOverlayProps {
  visible: boolean;
}

/**
 * GridOverlay Component
 * Renders a grid overlay on the canvas for visual alignment
 * Grid lines are drawn at fixed intervals (20px)
 */
const GridOverlay: React.FC<GridOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  const lines: React.ReactElement[] = [];

  // Vertical lines
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, CANVAS_HEIGHT]}
        stroke={GRID_COLOR}
        strokeWidth={1}
        opacity={GRID_OPACITY}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, CANVAS_WIDTH, y]}
        stroke={GRID_COLOR}
        strokeWidth={1}
        opacity={GRID_OPACITY}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }

  return <>{lines}</>;
};

export default GridOverlay;

