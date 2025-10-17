import React, { useState } from 'react';
import { Group, Circle, Text, Label, Tag, Text as LabelText } from 'react-konva';

interface CommentBadgeProps {
  x: number;
  y: number;
  commentCount: number;
  unresolvedCount: number;
  onClick: () => void;
  scale: number;
}

/**
 * CommentBadge Component
 * Displays a visual indicator on shapes that have comments
 * Shows comment count and differentiates between resolved/unresolved
 */
const CommentBadge: React.FC<CommentBadgeProps> = ({
  x,
  y,
  commentCount,
  unresolvedCount,
  onClick,
  scale,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate badge size - scales with zoom but enforces minimum
  const minBadgeSize = 24;
  const baseBadgeSize = 24;
  const badgeSize = Math.max(minBadgeSize / scale, baseBadgeSize);
  const badgeRadius = badgeSize / 2;

  // Position badge at top-right corner of shape
  const badgeX = x;
  const badgeY = y;

  // Choose color based on unresolved comments
  const hasUnresolved = unresolvedCount > 0;
  const badgeColor = hasUnresolved ? '#3b82f6' : '#6b7280'; // Blue for unresolved, gray for resolved
  
  // Font size scales with badge size
  const fontSize = badgeSize * 0.5; // 50% of badge size
  const countText = commentCount > 99 ? '99+' : commentCount.toString();

  // Tooltip text
  const tooltipText = unresolvedCount > 0
    ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}, ${unresolvedCount} unresolved`
    : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`;

  const handleClick = (e: any) => {
    e.cancelBubble = true; // Prevent event from propagating to stage
    onClick();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Change cursor to pointer
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset cursor
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'default';
    }
  };

  return (
    <Group
      x={badgeX}
      y={badgeY}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badge Circle */}
      <Circle
        x={0}
        y={0}
        radius={badgeRadius}
        fill={badgeColor}
        stroke="#ffffff"
        strokeWidth={2 / scale}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={4 / scale}
        shadowOffsetX={0}
        shadowOffsetY={2 / scale}
        opacity={isHovered ? 0.9 : 1}
      />

      {/* Comment Count Text */}
      <Text
        x={-badgeRadius}
        y={-fontSize / 2}
        width={badgeSize}
        height={fontSize}
        text={countText}
        fontSize={fontSize}
        fontFamily="Arial"
        fontStyle="bold"
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
      />

      {/* Tooltip on Hover */}
      {isHovered && (
        <Label
          x={0}
          y={-badgeRadius - 10 / scale}
          opacity={0.95}
        >
          <Tag
            fill="#1f2937"
            pointerDirection="down"
            pointerWidth={6 / scale}
            pointerHeight={4 / scale}
            cornerRadius={4 / scale}
            shadowColor="rgba(0, 0, 0, 0.3)"
            shadowBlur={4 / scale}
            shadowOffsetY={2 / scale}
          />
          <LabelText
            text={tooltipText}
            fontSize={12 / scale}
            fontFamily="Arial"
            fill="#ffffff"
            padding={6 / scale}
          />
        </Label>
      )}
    </Group>
  );
};

export default React.memo(CommentBadge);

