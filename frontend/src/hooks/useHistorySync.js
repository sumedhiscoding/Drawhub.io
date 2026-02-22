import { useEffect, useCallback } from 'react';
import { useHistory } from '../store/History';
import { ALLOWED_METHODS } from '../utils/constants';

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

  // Apply patches from undo/redo (with guard to prevent infinite loops)
  useEffect(() => {
    // Skip if no patch, or if we've already processed this exact patch
    if (!lastPatch || lastPatch.patch === undefined || lastPatch === lastProcessedPatchRef.current) {
      return;
    }
    
    // Mark this patch as processed before dispatching
    lastProcessedPatchRef.current = lastPatch;
    
    dispatchBoardAction({
      type: ALLOWED_METHODS.APPLY_PATCH,
      payload: {
        patch: lastPatch.patch,
        elementId: lastPatch.elementId,
      },
    });
  }, [lastPatch, dispatchBoardAction, lastProcessedPatchRef]);

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
