import { USER_COLORS } from './constants';

/**
 * Generate a deterministic user color based on userId
 * Same userId will always get the same color
 * 
 * @param userId - The user's unique identifier
 * @returns A color string from the USER_COLORS palette
 */
export function generateUserColor(userId: string): string {
  // Simple hash function to convert userId to a number
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use modulo to get an index within the color array bounds
  const index = Math.abs(hash) % USER_COLORS.length;
  
  return USER_COLORS[index];
}

