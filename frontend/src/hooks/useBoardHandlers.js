import { useCallback, useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { SocketContext } from '../store/Context/SocketContext';

import { TOOL_ACTION_TYPE, TOOLS, ALLOWED_METHODS } from '../utils/constants';
import { isPointNearElement } from '../utils/helpers';

// Composable hooks
import { useToolStyles } from './useToolStyles';
import { useDrawingRefs } from './useDrawingRefs';
import { useHistorySync } from './useHistorySync';
import { usePencilThrottle } from './usePencilThrottle';

// Element factories
import {
  stripForHistory,
  createPencilElement,
  createShapeElement,
  createTextElement,
  isShapeTool,
  createShapeMovePayload,
} from './elementFactories';

import { createChange } from '../utils/helpers';
import { REALTIME_CHANGE_TYPES, CHANGE_SOURCES } from '../utils/constants';
import { useBoardSync } from './useBoardSync';
import { useThrottledSync } from './useThrottledSync';

/**
 * Custom hook to handle board mouse events, text area blur, and undo/redo
 *
 * Single source of truth: BoardContext.elements
 * History (XState): Only tracks diffs for undo/redo navigation
 *
 * Composed from smaller hooks:
 * - useToolStyles: Tool style extraction
 * - useDrawingRefs: Ref management
 * - useHistorySync: Undo/redo patch application
 * - usePencilThrottle: RAF-based pencil drawing
 */
export const useBoardHandlers = () => {
  const { activeTool, ToolActionType, elements, dispatchBoardAction } = useContext(BoardContext);
  // Get tool styles (eliminates repetitive toolBoxState access)
  const styles = useToolStyles(activeTool);
  // Manage drawing refs
  const refs = useDrawingRefs(elements);

  const { socket } = useContext(SocketContext);
  const { applyChange, flushPendingSync } = useBoardSync({ socket });

  const {
    currentElementIdRef,
    drawStartElementRef,
    lastProcessedPatchRef,
    lastMoveDataRef,
    resetDrawingRefs,
    getCurrentElement,
    getElementsRef,
  } = refs;

  // History sync (handles patch application)
  const { canUndo, canRedo, record, handleUndo, handleRedo } = useHistorySync(
    dispatchBoardAction,
    lastProcessedPatchRef,
  );

  // Throttled sync function for pencil - syncs directly to socket without dispatching
  // This prevents double-dispatching (DRAW_MOVE already updated state)
  const throttledPencilSync = useThrottledSync(
    (change) => {
      if (socket?.connected) {
        try {
          socket.emit('element-update', change);
        } catch (error) {
          console.warn('Pencil sync failed (non-blocking):', error);
        }
      }
    },
    150, // Throttle to 150ms - balances real-time feel with network efficiency
  );

  // Callback to sync pencil after each RAF batch completes
  // This enables real-time sync during drawing
  const syncPencilAfterBatch = useCallback(() => {
    // Only sync if we have a current element and socket is connected
    if (!currentElementIdRef.current || !socket?.connected) return;

    // Get the updated element after RAF has executed
    // Use setTimeout to ensure state has updated
    setTimeout(() => {
      try {
        const currentElement = getCurrentElement();
        if (currentElement && currentElement.points) {
          // Sync the updated points - this is what makes real-time collaboration work
          const change = createChange({
            elementId: currentElement.id,
            type: REALTIME_CHANGE_TYPES.UPDATE,
            updates: {
              points: currentElement.points,
              // Include x2, y2 if they exist (for bounding box)
              ...(currentElement.x2 !== undefined && { x2: currentElement.x2 }),
              ...(currentElement.y2 !== undefined && { y2: currentElement.y2 }),
            },
            source: CHANGE_SOURCES.LOCAL,
          });

          // Use throttled sync to avoid too many network calls
          // This syncs directly to socket (don't dispatch UPDATE - DRAW_MOVE already did that)
          throttledPencilSync(change);
        }
      } catch (error) {
        console.warn('Pencil sync after batch failed (non-blocking):', error);
      }
    }, 0);
  }, [socket, currentElementIdRef, getCurrentElement, throttledPencilSync]);

  // Pencil throttling with real-time sync callback
  const { handlePencilMove, flushPendingPoints } = usePencilThrottle(
    refs,
    dispatchBoardAction,
    syncPencilAfterBatch, // Pass callback for real-time sync
  );

  // Mouse down handler
  const handleMouseDown = useCallback(
    (event) => {
      if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
        return;
      }

      const { clientX, clientY } = event;

      if (activeTool === TOOLS.PENCIL) {
        const newElement = createPencilElement(event, styles);
        currentElementIdRef.current = newElement.id;
        drawStartElementRef.current = null;
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: newElement,
        });
        return;
      }

      if (isShapeTool(activeTool)) {
        const newElement = createShapeElement(activeTool, clientX, clientY, styles);
        currentElementIdRef.current = newElement.id;
        drawStartElementRef.current = null;
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: newElement,
        });
        return;
      }

      if (activeTool === TOOLS.ERASER) {
        currentElementIdRef.current = null;
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: { type: activeTool, x1: clientX, y1: clientY },
        });
        return;
      }

      if (activeTool === TOOLS.TEXT) {
        const newElement = createTextElement(clientX, clientY, styles);
        currentElementIdRef.current = newElement.id;
        drawStartElementRef.current = null;
        dispatchBoardAction({
          type: ALLOWED_METHODS.ADD_TEXT,
          payload: newElement,
        });
      }
    },
    [
      activeTool,
      ToolActionType,
      styles,
      dispatchBoardAction,
      currentElementIdRef,
      drawStartElementRef,
    ],
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (event) => {
      if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
        return;
      }

      if (ToolActionType !== TOOL_ACTION_TYPE.DRAW && ToolActionType !== TOOL_ACTION_TYPE.ERASE) {
        return;
      }

      const { clientX, clientY } = event;

      if (activeTool === TOOLS.PENCIL) {
        // CRITICAL: handlePencilMove uses RAF to batch points and dispatch DRAW_MOVE
        // This is async, so we can't sync immediately - would use stale data
        // Pencil drawing is smooth because RAF batches updates efficiently
        handlePencilMove(event, styles);
        
        // Don't sync during drawing - DRAW_MOVE already handles state updates
        // Sync will happen on mouse up via flushPendingSync and final applyChange
        // This prevents:
        // 1. Stale data issues (getCurrentElement before RAF executes)
        // 2. Double-dispatching (DRAW_MOVE + UPDATE conflict)
        // 3. Performance issues (too many sync operations)
        return;
      }

      if (isShapeTool(activeTool)) {
        // CRITICAL: Dispatch DRAW_MOVE first - this makes the shape appear/expand
        // This is synchronous and immediate - shapes will draw smoothly
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_MOVE,
          payload: createShapeMovePayload(activeTool, clientX, clientY, styles),
        });

        // Sync is secondary - only sync, don't dispatch UPDATE (DRAW_MOVE already updated state)
        // Use the coordinates directly from the event to avoid stale data
        if (currentElementIdRef.current) {
          // Create change object for sync only (not for local state update)
          const change = createChange({
            elementId: currentElementIdRef.current,
            type: REALTIME_CHANGE_TYPES.UPDATE,
            updates: {
              x2: clientX,
              y2: clientY,
            },
            source: CHANGE_SOURCES.LOCAL,
          });
          
          // Sync only - don't call applyChange which would dispatch UPDATE to reducer
          // DRAW_MOVE already updated the reducer, so we only need to sync to socket
          // This prevents double-dispatch and stale data issues
          if (socket?.connected) {
            setTimeout(() => {
              try {
                if (socket?.connected) {
                  socket.emit('element-update', change);
                }
              } catch (error) {
                console.warn('Shape sync failed (non-blocking):', error);
              }
            }, 0);
          }
        }
        return;
      }

      if (activeTool === TOOLS.ERASER) {
        const elementsArray = getElementsRef();
        const elementToRemove = elementsArray.find((element) =>
          isPointNearElement(clientX, clientY, element),
        );

        if (elementToRemove) {
          // Record to history: before = element existed, after = null (removed)
          record({
            before: { element: stripForHistory(elementToRemove) },
            after: null,
            elementId: elementToRemove.id,
          });
          const change = createChange({
            elementId: elementToRemove.id,
            type: REALTIME_CHANGE_TYPES.DELETE,
            source: CHANGE_SOURCES.LOCAL,
          });
          applyChange(change, false, false);
          dispatchBoardAction({
            type: ALLOWED_METHODS.ERASE_ELEMENT,
            payload: { x1: clientX, y1: clientY },
          });
        }
      }
    },
    [
      activeTool,
      ToolActionType,
      styles,
      record,
      dispatchBoardAction,
      handlePencilMove,
      getElementsRef,
      applyChange,
      getCurrentElement,
      currentElementIdRef,
    ],
  );

  // Mouse up handler
  const handleMoveUp = useCallback(() => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
      return;
    }

    if (ToolActionType !== TOOL_ACTION_TYPE.DRAW && ToolActionType !== TOOL_ACTION_TYPE.ERASE) {
      return;
    }

    // Flush pending pencil points
    if (activeTool === TOOLS.PENCIL) {
      flushPendingPoints();
    }

    flushPendingSync();

    // Record to history if we were drawing (not erasing)
    if (currentElementIdRef.current && activeTool !== TOOLS.ERASER) {
      const finalElement = getCurrentElement();

      if (finalElement) {
        // Record: before = null (didn't exist), after = final element
        record({
          before: null,
          after: { element: stripForHistory(finalElement) },
          elementId: finalElement.id,
        });

        const change = createChange({
          elementId: finalElement.id,
          type: REALTIME_CHANGE_TYPES.ADD,
          element: stripForHistory(finalElement),
          source: CHANGE_SOURCES.LOCAL,
        });
        applyChange(change, false, false);
      }
    }

    // Reset refs and dispatch draw up
    resetDrawingRefs();
    lastMoveDataRef.current = null;

    dispatchBoardAction({
      type: ALLOWED_METHODS.DRAW_UP,
      payload: TOOL_ACTION_TYPE.NONE,
    });
  }, [
    ToolActionType,
    activeTool,
    record,
    dispatchBoardAction,
    flushPendingPoints,
    currentElementIdRef,
    getCurrentElement,
    resetDrawingRefs,
    lastMoveDataRef,
    applyChange,
    flushPendingSync,
  ]);

  // Text area blur handler
  const textAreaBlur = useCallback(
    (textValue) => {
      // Record text to history
      if (currentElementIdRef.current) {
        const finalElement = getCurrentElement();
        if (finalElement) {
          const elementWithText = { ...finalElement, text: textValue };
          record({
            before: null,
            after: { element: stripForHistory(elementWithText) },
            elementId: finalElement.id,
          });

          const change = createChange({
            elementId: finalElement.id,
            type: REALTIME_CHANGE_TYPES.UPDATE,
            updates: { text: textValue },
            source: CHANGE_SOURCES.LOCAL,
          });
          applyChange(change, false, false);
        }
      }
      currentElementIdRef.current = null;
      dispatchBoardAction({
        type: ALLOWED_METHODS.SAVE_TEXT,
        payload: { text: textValue },
      });
    },
    [record, dispatchBoardAction, currentElementIdRef, getCurrentElement, applyChange],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMoveUp,
    textAreaBlur,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
};
