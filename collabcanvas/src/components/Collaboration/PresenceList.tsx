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
    <div className="flex items-center gap-3">
      {/* User count */}
      <div className="text-sm text-gray-600 font-medium">
        {userCount === 0 && 'Loading...'}
        {userCount === 1 && 'You are alone'}
        {userCount > 1 && `${userCount} user${userCount > 1 ? 's' : ''} online`}
      </div>

      {/* User avatars */}
      <div className="flex items-center -space-x-2">
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
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 font-semibold text-xs shadow-md"
            title={`${otherUsers.length - 5} more user${otherUsers.length - 5 > 1 ? 's' : ''}`}
          >
            +{otherUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceList;

