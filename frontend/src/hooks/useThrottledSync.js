// hooks/useThrottledSync.js
import { useRef, useCallback, useEffect } from 'react';

/**
 * Creates a throttled function that only executes once per interval
 * Completely non-blocking - never affects drawing performance
 */
export const useThrottledSync = (syncFn, interval = 100) => {
  const lastSyncRef = useRef(0);
  const timeoutRef = useRef(null);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const throttledSync = useCallback(
    (change) => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRef.current;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If enough time has passed, sync immediately (but still async)
      if (timeSinceLastSync >= interval) {
        lastSyncRef.current = now;
        // Wrap in try-catch to ensure it never throws
        try {
          syncFn(change);
        } catch (error) {
          console.warn('Throttled sync failed (non-blocking):', error);
        }
      } else {
        // Otherwise, schedule sync for later
        timeoutRef.current = setTimeout(() => {
          lastSyncRef.current = Date.now();
          try {
            syncFn(change);
          } catch (error) {
            console.warn('Scheduled sync failed (non-blocking):', error);
          }
          timeoutRef.current = null;
        }, interval - timeSinceLastSync);
      }
    },
    [syncFn, interval],
  );

  return throttledSync;
};
