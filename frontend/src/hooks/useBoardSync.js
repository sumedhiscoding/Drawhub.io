import { useCallback, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { REALTIME_CHANGE_TYPES, CHANGE_SOURCES, ALLOWED_METHODS } from '../utils/constants';
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
          // Ensure change has all required fields
          const changeToEmit = {
            ...change,
            userId: change.userId || getLocalUserId(),
            timestamp: change.timestamp || Date.now(),
          };
          // Reduced logging for performance
          if (Math.random() < 0.2) { // Log 20% of the time
            console.log('📤 Immediate sync emitting element-update:', {
              elementId: changeToEmit.elementId,
              type: changeToEmit.type,
            });
          }
          // Fire and forget - never block
          socket.emit('element-update', changeToEmit);
        } catch (error) {
          // Silently fail - don't block drawing
          console.warn('Socket emit failed (non-blocking):', error);
        }
      } else {
        console.warn('⚠️ Socket not connected, cannot sync:', {
          elementId: change.elementId,
          type: change.type,
        });
      }
    },
    [socket],
  );

  const throttledSync = useThrottledSync(immediateSync, 100);

  const applyChange = useCallback(
    (change, isRemote = false, throttle = false) => {
      // CRITICAL: Dispatch to reducer FIRST - this is what makes drawing work
      // This must never wait for socket operations
      // For remote changes, dispatch immediately and synchronously
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
    if (!socket) {
      console.warn('useBoardSync: No socket available');
      return;
    }

    const handleRemoteChange = (change) => {
      // Reduced logging for performance - only log occasionally
      if (Math.random() < 0.1) {
        console.log('📥 useBoardSync: Received element-update', {
          elementId: change.elementId,
          type: change.type,
        });
      }
      
      // Only apply if it's not from us (if server doesn't exclude sender)
      if (change.userId !== getLocalUserId()) {
        // Apply immediately - don't batch or delay
        // This is critical for smooth real-time updates
        applyChange(change, true);
      }
    };

    const handleClearBoard = () => {
      console.log('📥 useBoardSync: Received clear-board event');
      // Clear board immediately
      dispatchBoardAction({
        type: ALLOWED_METHODS.CLEAR_BOARD,
      });
    };

    console.log('useBoardSync: Setting up element-update and clear-board listeners');
    socket.on('element-update', handleRemoteChange);
    socket.on('clear-board', handleClearBoard);

    return () => {
      console.log('useBoardSync: Cleaning up listeners');
      socket.off('element-update', handleRemoteChange);
      socket.off('clear-board', handleClearBoard);
    };
  }, [socket, applyChange, dispatchBoardAction]);

  return { applyChange, flushPendingSync };
};
