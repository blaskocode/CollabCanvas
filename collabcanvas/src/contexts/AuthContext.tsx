import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { toUser } from '../utils/types';
import type { User, AuthContextType } from '../utils/types';
import * as authService from '../services/auth';

// Create the context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser(toUser(firebaseUser));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await authService.signIn(email, password);
  };

  const signup = async (email: string, password: string, displayName: string): Promise<void> => {
    await authService.signUp(email, password, displayName);
  };

  const loginWithGoogle = async (): Promise<void> => {
    await authService.signInWithGoogle();
  };

  const logout = async (): Promise<void> => {
    await authService.signOut();
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

