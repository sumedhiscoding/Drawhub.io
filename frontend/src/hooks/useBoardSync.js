import { useCallback, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { REALTIME_CHANGE_TYPES, CHANGE_SOURCES } from '../utils/constants';
import { getLocalUserId } from '../utils/helpers';
import { useThrottledSync } from './useThrottledSync';


export const useBoardSync = ({ socket }) => {

  const { dispatchBoardAction } = useContext(BoardContext);
  const pendingFinalSyncRef = useRef(null); // Track pending final sync

  // Immediate sync (for final changes)
  const immediateSync = useCallback(
    (change) => {
      if (socket && socket.connected) {
        socket.emit('element-update', change);
      }
    },
    [socket],
  );

  const throttledSync = useThrottledSync(immediateSync, 100);

  const applyChange = useCallback(
    (change, isRemote = false, throttle = false) => {
      // Dispatch to reducer
      dispatchBoardAction({
        type: change.type,
        payload: {
          elementId: change.elementId,
          element: change.element,
          updates: change.updates,
        },
      });

      if (!isRemote && socket && socket.connected) {
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
      }
    },
    [socket, dispatchBoardAction, immediateSync, throttledSync],
  );

  // Flush any pending throttled sync (call on draw completion)
  const flushPendingSync = useCallback(() => {
    if (pendingFinalSyncRef.current && socket && socket.connected) {
      immediateSync(pendingFinalSyncRef.current);
      pendingFinalSyncRef.current = null;
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
