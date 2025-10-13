import { USER_COLORS } from './constants';

/**
 * Utility Helper Functions
 */

/**
 * Generate a consistent color for a user based on their userId
 * Uses a simple hash function to deterministically assign colors
 * 
 * @param userId - The user's unique ID
 * @returns A hex color string from the USER_COLORS palette
 */
export const generateUserColor = (userId: string): string => {
  // Simple hash function to convert userId to a number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index in color array
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

/**
 * Truncate a display name to fit in a label
 * 
 * @param name - The display name
 * @param maxLength - Maximum length (default: 20)
 * @returns Truncated name with ellipsis if needed
 */
export const truncateDisplayName = (name: string, maxLength: number = 20): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength - 3) + '...';
};

/**
 * Check if a timestamp is stale (older than threshold)
 * 
 * @param timestamp - The timestamp to check (milliseconds)
 * @param thresholdMs - Threshold in milliseconds (default: 10000 = 10 seconds)
 * @returns true if stale, false otherwise
 */
export const isStaleTimestamp = (timestamp: number, thresholdMs: number = 10000): boolean => {
  return Date.now() - timestamp > thresholdMs;
};
