import { useCallback, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { REALTIME_CHANGE_TYPES, CHANGE_SOURCES, ALLOWED_METHODS, UNDO_REDO_FLAG } from '../utils/constants';
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
          // Fire and forget - never block
          socket.emit('element-update', changeToEmit);
        } catch (error) {
          // Silently fail - don't block drawing
        }
      }
    },
    [socket],
  );

  const throttledSync = useThrottledSync(immediateSync, 100);

  const applyChange = useCallback(
    (change, isRemote = false, throttle = false) => {
      // Check if this is an undo/redo operation
      const isUndoRedo = change[UNDO_REDO_FLAG] === true;

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
      // 
      // For undo/redo operations:
      // - Local undo/redo: Already synced in useHistorySync, don't sync again here
      // - Remote undo/redo: Don't sync back (isRemote=true prevents this)
      // - Regular changes: Sync normally if local
      if (!isRemote && !isUndoRedo && socket?.connected) {
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
          // Silently fail
        }
      }, 0);
    }
  }, [socket, immediateSync]);

  // Listen for remote changes
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleRemoteChange = (change) => {
      // Only apply if it's not from us (if server doesn't exclude sender)
      if (change.userId !== getLocalUserId()) {
        // Apply immediately - don't batch or delay
        // This is critical for smooth real-time updates
        // 
        // For remote undo/redo changes:
        // - Apply the change to board state (via applyChange with isRemote=true)
        // - Do NOT record to history (isRemote=true prevents history recording)
        // - Do NOT sync back (isRemote=true prevents sync)
        applyChange(change, true);
      }
    };

    const handleClearBoard = () => {
      // Clear board immediately
      dispatchBoardAction({
        type: ALLOWED_METHODS.CLEAR_BOARD,
      });
    };

    socket.on('element-update', handleRemoteChange);
    socket.on('clear-board', handleClearBoard);

    return () => {
      socket.off('element-update', handleRemoteChange);
      socket.off('clear-board', handleClearBoard);
    };
  }, [socket, applyChange, dispatchBoardAction]);

  return { applyChange, flushPendingSync };
};
