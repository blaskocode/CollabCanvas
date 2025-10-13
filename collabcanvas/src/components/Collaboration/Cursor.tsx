import React from 'react';
import { truncateDisplayName } from '../../utils/helpers';

interface CursorProps {
  x: number;
  y: number;
  color: string;
  name: string;
}

/**
 * Cursor Component
 * Renders another user's cursor with their name label
 * 
 * @param props - Cursor properties
 */
const Cursor: React.FC<CursorProps> = ({ x, y, color, name }) => {
  const truncatedName = truncateDisplayName(name, 15);

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        {/* Cursor arrow shape */}
        <path
          d="M5.65376 12.3673L13.1732 19.8867L15.3765 14.2656L21.2344 14.2656L5.65376 12.3673Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{
          backgroundColor: color,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        {truncatedName}
      </div>
    </div>
  );
};

export default Cursor;

