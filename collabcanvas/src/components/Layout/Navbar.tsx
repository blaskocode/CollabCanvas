import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePresence } from '../../hooks/usePresence';
import PresenceList from '../Collaboration/PresenceList';

export const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const toast = useToast();
  
  // Get online users for presence list
  const { onlineUsers } = usePresence(
    currentUser?.uid || null,
    currentUser?.displayName || currentUser?.email || null,
    !!currentUser
  );

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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              CollabCanvas
            </h1>
          </div>

          {/* Presence List and User Info */}
          <div className="flex items-center space-x-6">
            {/* Online Users */}
            <PresenceList 
              onlineUsers={onlineUsers}
              currentUserId={currentUser?.uid || null}
            />

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
            {/* User Display Name */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                {currentUser.displayName?.charAt(0).toUpperCase() || 
                 currentUser.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentUser.displayName || currentUser.email}
              </span>
            </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
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

