/**
 * Time helper utilities for displaying human-readable time differences
 */

/**
 * Converts a timestamp to a human-readable "time ago" string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable string like "just now", "2 minutes ago", etc.
 */
export function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/**
 * Formats a timestamp to a readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string like "Oct 15, 2025 at 2:30 PM"
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

