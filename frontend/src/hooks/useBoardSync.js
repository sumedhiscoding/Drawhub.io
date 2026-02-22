import { useCallback, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { REALTIME_CHANGE_TYPES, CHANGE_SOURCES } from '../utils/constants';
import { getLocalUserId } from '../utils/helpers';
import { useThrottledSync } from './useThrottledSync';


export const useBoardSync = ({ socket }) => {

  const { dispatchBoardAction } = useContext(BoardContext);
  const pendingFinalSyncRef = useRef(null); // Track pending final sync

  // Immediate sync (for final changes) - completely non-blocking
  const immediateSync = useCallback(
    (change) => {
      // Quick check - don't block if socket not ready
      if (socket?.connected) {
        try {
          // Fire and forget - never block
          socket.emit('element-update', change);
        } catch (error) {
          // Silently fail - don't block drawing
          console.warn('Socket emit failed (non-blocking):', error);
        }
      }
    },
    [socket],
  );

  const throttledSync = useThrottledSync(immediateSync, 100);

  const applyChange = useCallback(
    (change, isRemote = false, throttle = false) => {
      // CRITICAL: Dispatch to reducer FIRST - this is what makes drawing work
      // This must never wait for socket operations
      dispatchBoardAction({
        type: change.type,
        payload: {
          elementId: change.elementId,
          element: change.element,
          updates: change.updates,
        },
      });

      // Sync is secondary - completely async and fire-and-forget
      // Never block drawing on sync operations
      if (!isRemote && socket?.connected) {
        // Use setTimeout to ensure sync is completely async
        // This ensures reducer dispatch happens immediately
        setTimeout(() => {
          try {
            if (throttle) {
              // Throttled sync for ongoing drawings
              throttledSync(change);
              // Store for final sync on completion
              pendingFinalSyncRef.current = change;
            } else {
              // Immediate sync for final changes
              immediateSync(change);
              pendingFinalSyncRef.current = null;
            }
          } catch (error) {
            // Silently fail - drawing should never be blocked by sync
            console.warn('Sync failed (non-blocking):', error);
          }
        }, 0);
      }
    },
    [socket, dispatchBoardAction, immediateSync, throttledSync],
  );

  // Flush any pending throttled sync (call on draw completion) - non-blocking
  const flushPendingSync = useCallback(() => {
    if (pendingFinalSyncRef.current && socket?.connected) {
      // Make flush async too
      setTimeout(() => {
        try {
          immediateSync(pendingFinalSyncRef.current);
          pendingFinalSyncRef.current = null;
        } catch (error) {
          console.warn('Flush sync failed (non-blocking):', error);
        }
      }, 0);
    }
  }, [socket, immediateSync]);

  // Listen for remote changes
  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = (change) => {
      // Only apply if it's not from us (if server doesn't exclude sender)
      if (change.userId !== getLocalUserId()) {
        applyChange(change, true);
      }
    };

    socket.on('element-update', handleRemoteChange);

    return () => {
      socket.off('element-update', handleRemoteChange);
    };
  }, [socket, applyChange]);

  return { applyChange, flushPendingSync };
};
