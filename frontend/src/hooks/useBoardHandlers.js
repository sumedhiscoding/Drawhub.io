import { useCallback, useContext } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import {
  TOOL_ACTION_TYPE,
  TOOLS,
  ALLOWED_METHODS,
} from '../utils/constants';
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
    lastProcessedPatchRef
  );

  // Pencil throttling
  const { handlePencilMove, flushPendingPoints } = usePencilThrottle(refs, dispatchBoardAction);

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
    [activeTool, ToolActionType, styles, dispatchBoardAction, currentElementIdRef, drawStartElementRef],
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
        handlePencilMove(event, styles);
        return;
      }

      if (isShapeTool(activeTool)) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_MOVE,
          payload: createShapeMovePayload(activeTool, clientX, clientY, styles),
        });
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

          dispatchBoardAction({
            type: ALLOWED_METHODS.ERASE_ELEMENT,
            payload: { x1: clientX, y1: clientY },
          });
        }
      }
    },
    [activeTool, ToolActionType, styles, record, dispatchBoardAction, handlePencilMove, getElementsRef],
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
        }
      }

      currentElementIdRef.current = null;

      dispatchBoardAction({
        type: ALLOWED_METHODS.SAVE_TEXT,
        payload: { text: textValue },
      });
    },
    [record, dispatchBoardAction, currentElementIdRef, getCurrentElement],
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
