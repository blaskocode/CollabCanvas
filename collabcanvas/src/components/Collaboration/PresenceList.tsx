import React from 'react';
import UserPresence from './UserPresence';
import type { PresenceUser } from '../../utils/types';

interface PresenceListProps {
  onlineUsers: PresenceUser[];
  currentUserId: string | null;
}

/**
 * PresenceList Component
 * Displays list of online users with their avatars
 * 
 * @param props - Presence list properties
 */
const PresenceList: React.FC<PresenceListProps> = ({ onlineUsers, currentUserId }) => {
  const userCount = onlineUsers.length;
  const otherUsers = onlineUsers.filter(user => user.userId !== currentUserId);
  const currentUser = onlineUsers.find(user => user.userId === currentUserId);

  return (
    <div className="flex items-center gap-4">
      {/* User count with icon */}
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <div className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {userCount === 0 && 'Loading...'}
          {userCount === 1 && 'You are alone'}
          {userCount > 1 && `${userCount} online`}
        </div>
      </div>

      {/* User avatars */}
      <div className="flex items-center -space-x-3">
        {/* Current user first */}
        {currentUser && (
          <UserPresence
            key={currentUser.userId}
            displayName={currentUser.displayName}
            color={currentUser.cursorColor}
            isCurrentUser={true}
          />
        )}

        {/* Other users */}
        {otherUsers.slice(0, 5).map((user) => (
          <UserPresence
            key={user.userId}
            displayName={user.displayName}
            color={user.cursorColor}
          />
        ))}

        {/* Show "+X more" if there are more than 6 users */}
        {otherUsers.length > 5 && (
          <div className="relative group">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 font-bold text-xs shadow-lg ring-2 ring-white hover:scale-125 transition-all duration-300 cursor-pointer"
              title={`${otherUsers.length - 5} more user${otherUsers.length - 5 > 1 ? 's' : ''}`}
            >
              +{otherUsers.length - 5}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceList;

