import { useEffect, useState } from 'react';
import { ref, onValue, getDatabase } from 'firebase/database';

/**
 * Connection status types
 */
export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

/**
 * Hook to monitor Firebase and browser connection status
 * 
 * Uses dual signal approach:
 * 1. Firebase RTDB `.info/connected` for Firebase connectivity
 * 2. window.navigator.onLine for general network connectivity
 * 
 * Debounces state changes to prevent flickering
 * 
 * @returns Current connection status
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine);
  
  // Monitor Firebase RTDB connection
  useEffect(() => {
    const db = getDatabase();
    const connectedRef = ref(db, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snap) => {
      setFirebaseConnected(snap.val() === true);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Determine overall status with debouncing
  useEffect(() => {
    let timeoutId: number;
    
    const updateStatus = () => {
      if (!browserOnline || !firebaseConnected) {
        setStatus('offline');
      } else if (browserOnline && firebaseConnected) {
        setStatus('connected');
      } else {
        setStatus('reconnecting');
      }
    };
    
    // Debounce status changes by 500ms to prevent flicker
    timeoutId = window.setTimeout(updateStatus, 500);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [firebaseConnected, browserOnline]);
  
  return status;
}

