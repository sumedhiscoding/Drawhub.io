import { useEffect, useCallback, useContext } from 'react';
import { useHistory } from '../store/history';
import { SocketContext } from '../store/Context/SocketContext';
import { ALLOWED_METHODS, REALTIME_CHANGE_TYPES, CHANGE_SOURCES, UNDO_REDO_FLAG } from '../utils/constants';
import { createChange, getLocalUserId } from '../utils/helpers';

/**
 * Convert history patch to change object for WebSocket sync
 * @param {Object} patch - History patch (can be null, {element}, or {updates})
 * @param {string} elementId - Element ID
 * @param {string} action - 'undo' or 'redo'
 * @returns {Object|null} Change object or null
 */
const patchToChange = (patch, elementId, action) => {
  if (!elementId) return null;

  // null patch = element deletion
  if (!patch) {
    return createChange({
      elementId,
      type: REALTIME_CHANGE_TYPES.DELETE,
      source: CHANGE_SOURCES.LOCAL,
    });
  }

  // Patch with full element = add/restore element
  if (patch.element) {
    return createChange({
      elementId,
      type: REALTIME_CHANGE_TYPES.ADD,
      element: patch.element,
      source: CHANGE_SOURCES.LOCAL,
    });
  }

  // Patch with updates = update element
  if (patch.updates) {
    return createChange({
      elementId,
      type: REALTIME_CHANGE_TYPES.UPDATE,
      updates: patch.updates,
      source: CHANGE_SOURCES.LOCAL,
    });
  }

  return null;
};

/**
 * Hook to sync history patches with board state
 * Handles applying patches from undo/redo operations
 * 
 * @param {Function} dispatchBoardAction - Board action dispatcher
 * @param {Object} lastProcessedPatchRef - Ref to track processed patches
 * @returns {Object} History controls and state
 */
export const useHistorySync = (dispatchBoardAction, lastProcessedPatchRef) => {
  const history = useHistory();
  const { canUndo, canRedo, record, undo: historyUndo, redo: historyRedo, lastPatch } = history;
  const { socket } = useContext(SocketContext);

  // Apply patches from undo/redo (with guard to prevent infinite loops)
  useEffect(() => {
    // Skip if no patch, or if we've already processed this exact patch
    if (!lastPatch || lastPatch.patch === undefined || lastPatch === lastProcessedPatchRef.current) {
      return;
    }
    
    // Mark this patch as processed before dispatching
    lastProcessedPatchRef.current = lastPatch;
    
    // Apply patch locally
    dispatchBoardAction({
      type: ALLOWED_METHODS.APPLY_PATCH,
      payload: {
        patch: lastPatch.patch,
        elementId: lastPatch.elementId,
      },
    });

    // Convert patch to change object and sync to WebSocket (if connected)
    // Only sync local undo/redo operations (not remote ones)
    if (socket?.connected && lastPatch.action) {
      const change = patchToChange(lastPatch.patch, lastPatch.elementId, lastPatch.action);
      if (change) {
        // Add undo/redo flag to distinguish from regular changes
        const changeWithFlag = {
          ...change,
          [UNDO_REDO_FLAG]: true,
        };
        
        // Emit to WebSocket immediately (undo/redo should be responsive)
        setTimeout(() => {
          try {
            if (socket?.connected) {
              socket.emit('element-update', {
                ...changeWithFlag,
                userId: getLocalUserId(),
                timestamp: Date.now(),
              });
            }
          } catch (error) {
            // Silently fail - don't block undo/redo
          }
        }, 0);
      }
    }
  }, [lastPatch, dispatchBoardAction, lastProcessedPatchRef, socket]);

  // Undo - navigates history and applies patch
  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    historyUndo();
  }, [canUndo, historyUndo]);

  // Redo - navigates history and applies patch
  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    historyRedo();
  }, [canRedo, historyRedo]);

  return {
    canUndo,
    canRedo,
    record,
    handleUndo,
    handleRedo,
  };
};

export default useHistorySync;
