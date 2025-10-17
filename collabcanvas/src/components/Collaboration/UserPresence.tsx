import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface UserPresenceProps {
  displayName: string;
  color: string;
  isCurrentUser?: boolean;
}

/**
 * UserPresence Component
 * Displays a user's avatar with their first initial and color
 * 
 * @param props - User presence properties
 */
const UserPresence: React.FC<UserPresenceProps> = ({ displayName, color, isCurrentUser = false }) => {
  // Get first letter of display name
  const initial = displayName.charAt(0).toUpperCase();
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const avatarRef = React.useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 12, // 12px below the icon
        left: rect.left + rect.width / 2, // Center horizontally
      });
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <div
        ref={avatarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
        title={displayName}
      >
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 hover:scale-125 ring-2 ring-white hover:ring-4 cursor-pointer"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
          {/* Online indicator pulse */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
      </div>
      
      {/* Tooltip rendered in portal at document root */}
      {isHovered && createPortal(
        <div 
          className="fixed px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-xl transition-opacity duration-300"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 99999,
          }}
        >
          {displayName}
          {isCurrentUser && (
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-500 rounded text-xs">You</span>
          )}
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"
            style={{ marginBottom: '-1px' }}
          ></div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UserPresence;

