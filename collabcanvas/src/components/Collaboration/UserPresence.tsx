import React from 'react';

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

  return (
    <div
      className="group relative"
      title={displayName}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {displayName}
        {isCurrentUser && ' (You)'}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default UserPresence;

