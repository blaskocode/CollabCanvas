import { useAuthContext } from '../contexts/AuthContext';
import type { AuthContextType } from '../utils/types';

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider
 * 
 * @returns AuthContextType - Authentication state and methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * const { currentUser, loading, login, logout } = useAuth();
 */
export const useAuth = (): AuthContextType => {
  return useAuthContext();
};

export default useAuth;

