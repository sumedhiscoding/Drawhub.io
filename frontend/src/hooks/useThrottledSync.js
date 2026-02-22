// hooks/useThrottledSync.js
import { useRef, useCallback } from 'react';

/**
 * Creates a throttled function that only executes once per interval
 */
export const useThrottledSync = (syncFn, interval = 100) => {
  const lastSyncRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledSync = useCallback(
    (change) => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRef.current;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If enough time has passed, sync immediately
      if (timeSinceLastSync >= interval) {
        lastSyncRef.current = now;
        syncFn(change);
      } else {
        // Otherwise, schedule sync for later
        timeoutRef.current = setTimeout(() => {
          lastSyncRef.current = Date.now();
          syncFn(change);
          timeoutRef.current = null;
        }, interval - timeSinceLastSync);
      }
    },
    [syncFn, interval],
  );

  return throttledSync;
};
