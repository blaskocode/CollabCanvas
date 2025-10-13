import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import { auth } from './firebase';

const MAX_DISPLAY_NAME_LENGTH = 20;

/**
 * Truncate display name to maximum length
 */
const truncateDisplayName = (name: string): string => {
  if (name.length <= MAX_DISPLAY_NAME_LENGTH) {
    return name;
  }
  return name.substring(0, MAX_DISPLAY_NAME_LENGTH);
};

/**
 * Extract display name from email (part before @)
 */
const getDisplayNameFromEmail = (email: string): string => {
  const emailPrefix = email.split('@')[0];
  return truncateDisplayName(emailPrefix);
};

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @param displayName - User's display name
 * @returns Promise that resolves when signup is complete
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    const truncatedName = truncateDisplayName(displayName || getDisplayNameFromEmail(email));
    await updateProfile(userCredential.user, {
      displayName: truncatedName,
    });

    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise that resolves when signin is complete
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // If user doesn't have a display name, set one from email
    if (!userCredential.user.displayName) {
      const displayName = getDisplayNameFromEmail(email);
      await updateProfile(userCredential.user, {
        displayName,
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 * @returns Promise that resolves when Google signin is complete
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Google sign-in should automatically provide display name
    // But if it doesn't, extract from email
    if (!userCredential.user.displayName && userCredential.user.email) {
      const displayName = getDisplayNameFromEmail(userCredential.user.email);
      await updateProfile(userCredential.user, {
        displayName: truncateDisplayName(displayName),
      });
    } else if (userCredential.user.displayName) {
      // Ensure Google display name is also truncated if needed
      const truncatedName = truncateDisplayName(userCredential.user.displayName);
      if (truncatedName !== userCredential.user.displayName) {
        await updateProfile(userCredential.user, {
          displayName: truncatedName,
        });
      }
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns Promise that resolves when signout is complete
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Update user's display name
 * @param displayName - New display name
 * @returns Promise that resolves when update is complete
 */
export const updateUserProfile = async (displayName: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }

    const truncatedName = truncateDisplayName(displayName);
    await updateProfile(auth.currentUser, {
      displayName: truncatedName,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Get user-friendly error message from Firebase auth error
 * @param error - Firebase auth error
 * @returns User-friendly error message
 */
export const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in cancelled. Please try again.';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
};

