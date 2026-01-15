import { createContext, useContext } from 'react';

/**
 * Simplified History Context
 *
 * Only provides undo/redo history navigation
 * Does NOT store elements - single source of truth elsewhere
 */
const HistoryContext = createContext({
  // Can we undo/redo?
  canUndo: false,
  canRedo: false,
  historySize: 0,

  // Record a change (call after action completes)
  // record({ before, after, elementId })
  record: () => {},

  // Navigate history
  undo: () => {},
  redo: () => {},
  clear: () => {},

  // The patch from the last undo/redo (null if none)
  // Shape: { patch, elementId, action: 'undo' | 'redo' }
  lastPatch: null,
});

// Convenience hook
const useHistory = () => useContext(HistoryContext);

export { HistoryContext, useHistory };
export default HistoryContext;
