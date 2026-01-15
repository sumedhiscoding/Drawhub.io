import React, { useCallback, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { HistoryContext } from './HistoryContext';
import { historyMachine } from './historyMachine';

/**
 * Simplified History Provider
 *
 * SINGLE RESPONSIBILITY: Manage undo/redo history
 * Does NOT manage elements - that's BoardContext's job
 *
 * Usage:
 * 1. Call record({ before, after, elementId }) when a change is complete
 * 2. Call undo() or redo() - check lastPatch for the patch to apply
 * 3. Apply the patch to your elements yourself (via useEffect on lastPatch)
 */
const HistoryProvider = ({ children }) => {
  const [state, send] = useMachine(historyMachine);

  // Record a change to history
  const record = useCallback(
    ({ before, after, elementId }) => {
      send({ type: 'RECORD', before, after, elementId });
    },
    [send],
  );

  // Undo - moves pointer back
  const undo = useCallback(() => {
    send({ type: 'UNDO' });
  }, [send]);

  // Redo - moves pointer forward
  const redo = useCallback(() => {
    send({ type: 'REDO' });
  }, [send]);

  // Clear history
  const clear = useCallback(() => {
    send({ type: 'CLEAR' });
  }, [send]);

  const canUndo = state.context.current !== null;
  const canRedo =
    state.context.current?.next !== null || (!state.context.current && state.context.head !== null);

  const contextValue = useMemo(
    () => ({
      // State info
      canUndo,
      canRedo,
      historySize: state.context.size,

      // Actions
      record,
      undo,
      redo,
      clear,

      // Last patch from undo/redo (for manual application)
      lastPatch: state.context.lastPatch,
    }),
    [canUndo, canRedo, state.context.size, state.context.lastPatch, record, undo, redo, clear],
  );

  return <HistoryContext.Provider value={contextValue}>{children}</HistoryContext.Provider>;
};

export { HistoryProvider };
export default HistoryProvider;
