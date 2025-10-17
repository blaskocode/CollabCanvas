import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePresence } from '../../hooks/usePresence';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import PresenceList from '../Collaboration/PresenceList';

export const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const toast = useToast();
  const connectionStatus = useConnectionStatus();
  const [showConnectionTooltip, setShowConnectionTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const connectionBadgeRef = useRef<HTMLDivElement>(null);
  
  // Get online users for presence list
  const { onlineUsers } = usePresence(
    currentUser?.uid || null,
    currentUser?.displayName || currentUser?.email || null,
    !!currentUser
  );
  
  // Get connection status display info
  const getConnectionInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          textColor: 'text-green-700',
          tooltip: 'Connected to server'
        };
      case 'reconnecting':
        return {
          color: 'bg-yellow-500 animate-pulse',
          text: 'Reconnecting',
          textColor: 'text-yellow-700',
          tooltip: 'Attempting to reconnect...'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          text: 'Offline',
          textColor: 'text-red-700',
          tooltip: 'No connection. Changes will sync when online.'
        };
    }
  };
  
  const connectionInfo = getConnectionInfo();

  const handleConnectionMouseEnter = () => {
    if (connectionBadgeRef.current) {
      const rect = connectionBadgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8, // 8px below the badge
        left: rect.left + rect.width / 2, // Center horizontally
      });
      setShowConnectionTooltip(true);
    }
  };

  const handleConnectionMouseLeave = () => {
    setShowConnectionTooltip(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <nav 
      className="glass-strong shadow-lg backdrop-blur-xl relative overflow-hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Animated gradient bar at top */}
      <div className="h-1 animated-gradient-bg"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                CollabCanvas
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Create Together</p>
            </div>
          </div>

          {/* Presence List and User Info */}
          <div className="flex items-center space-x-6">
            {/* Online Users */}
            <PresenceList 
              onlineUsers={onlineUsers}
              currentUserId={currentUser?.uid || null}
            />

            {/* Divider */}
            <div 
              className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" 
              role="separator"
              aria-hidden="true"
            ></div>

            {/* Connection Status Badge */}
            <div 
              ref={connectionBadgeRef}
              onMouseEnter={handleConnectionMouseEnter}
              onMouseLeave={handleConnectionMouseLeave}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-default"
              role="status"
              aria-label={`Connection status: ${connectionInfo.text}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${connectionInfo.color} shadow-sm`}></div>
              <span className={`text-xs font-medium ${connectionInfo.textColor}`}>
                {connectionInfo.text}
              </span>
            </div>
            
            {/* Tooltip rendered in portal at document root */}
            {showConnectionTooltip && createPortal(
              <div 
                className="fixed px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none shadow-lg transition-opacity duration-200"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 99999,
                }}
              >
                {connectionInfo.tooltip}
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"
                  style={{ marginBottom: '-1px' }}
                ></div>
              </div>,
              document.body
            )}

            {/* Divider */}
            <div 
              className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" 
              role="separator"
              aria-hidden="true"
            ></div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              {/* User Display Name */}
              <div 
                className="flex items-center space-x-3 group"
                aria-label="Current user"
              >
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white transform group-hover:scale-110 transition-all duration-300"
                    aria-hidden="true"
                  >
                    {currentUser.displayName?.charAt(0).toUpperCase() || 
                     currentUser.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {currentUser.displayName || currentUser.email}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                aria-label="Log out of CollabCanvas"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

