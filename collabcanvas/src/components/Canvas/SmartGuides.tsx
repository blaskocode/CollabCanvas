import React from 'react';
import { Line } from 'react-konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GUIDE_COLOR, GUIDE_OPACITY } from '../../utils/constants';
import type { AlignmentGuide } from '../../utils/snapping';

interface SmartGuidesProps {
  guides: AlignmentGuide[];
}

/**
 * SmartGuides Component
 * Renders alignment guide lines when shapes align with each other
 * Shows vertical and horizontal lines to indicate alignment
 */
const SmartGuides: React.FC<SmartGuidesProps> = ({ guides }) => {
  if (guides.length === 0) return null;

  return (
    <>
      {guides.map((guide, index) => {
        if (guide.type === 'vertical') {
          // Vertical line (constant x)
          return (
            <Line
              key={`guide-v-${index}`}
              points={[guide.position, 0, guide.position, CANVAS_HEIGHT]}
              stroke={GUIDE_COLOR}
              strokeWidth={2}
              opacity={GUIDE_OPACITY}
              listening={false}
              perfectDrawEnabled={false}
              shadowColor={GUIDE_COLOR}
              shadowBlur={4}
              shadowOpacity={0.3}
            />
          );
        } else {
          // Horizontal line (constant y)
          return (
            <Line
              key={`guide-h-${index}`}
              points={[0, guide.position, CANVAS_WIDTH, guide.position]}
              stroke={GUIDE_COLOR}
              strokeWidth={2}
              opacity={GUIDE_OPACITY}
              listening={false}
              perfectDrawEnabled={false}
              shadowColor={GUIDE_COLOR}
              shadowBlur={4}
              shadowOpacity={0.3}
            />
          );
        }
      })}
    </>
  );
};

export default SmartGuides;

