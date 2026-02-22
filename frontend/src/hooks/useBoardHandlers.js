import React, { useCallback, useContext, useRef, useEffect } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { useHistory } from '../store/History';
import {
  TOOL_ACTION_TYPE,
  TOOLS,
  ALLOWED_METHODS,
} from '../utils/constants';
import ToolboxContext from '../store/Context/ToolBoxContext';
import {
  createTool,
  isPointNearElement,
  generateElementId,
  getLocalUserId,
} from '../utils/helpers';

const stripForHistory = (element) => {
  if (!element) return null;
  const { roughElement, ...minimal } = element;
  return minimal;
};

/**
 * Custom hook to handle board mouse events, text area blur, and undo/redo
 *
 * Single source of truth: BoardContext.elements
 * History (XState): Only tracks diffs for undo/redo navigation
 */
export const useBoardHandlers = () => {
  const { activeTool, ToolActionType, elements, dispatchBoardAction } = useContext(BoardContext);
  const { toolBoxState } = useContext(ToolboxContext);
  const history = useHistory();

  const { canUndo, canRedo, record, undo: historyUndo, redo: historyRedo, lastPatch } = history;

  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Track the element being drawn (for recording to history on DRAW_UP)
  const currentElementIdRef = useRef(null);
  const drawStartElementRef = useRef(null); // Store the element state at start
  const lastProcessedPatchRef = useRef(null); // Track processed patches to prevent infinite loops

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
  }, [lastPatch, dispatchBoardAction]);

  // Throttling refs for smooth drawing
  const rafIdRef = useRef(null);
  const pendingPointsRef = useRef([]);
  const lastMoveDataRef = useRef(null);

  const handleMouseDown = useCallback(
    (event) => {
      if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
        return;
      }
      const { clientX, clientY } = event;
      const userId = getLocalUserId();
      const elementId = generateElementId();

      switch (activeTool) {
        case TOOLS.PENCIL: {
          const newElement = {
            id: elementId,
            ownerId: userId,
            type: activeTool.id,
            points: [[event.pageX, event.pageY, event.pressure || 0.5]],
            strokeWidth: toolBoxState[activeTool.name].size,
            color: toolBoxState[activeTool.name].stroke,
            thinning: toolBoxState[activeTool.name].thinning,
            smoothing: toolBoxState[activeTool.name].smoothing,
            streamline: toolBoxState[activeTool.name].streamline,
            roughElement: createTool(
              activeTool.id,
              0,
              0,
              0,
              0,
              toolBoxState[activeTool.name].stroke,
              [[event.pageX, event.pageY, event.pressure || 0.5]],
              toolBoxState[activeTool.name].size,
              null,
              null,
              toolBoxState[activeTool.name].thinning,
              toolBoxState[activeTool.name].smoothing,
              toolBoxState[activeTool.name].streamline,
            ),
          };

          currentElementIdRef.current = elementId;
          drawStartElementRef.current = null; // New element, didn't exist before
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_DOWN,
            payload: newElement,
          });
          break;
        }
        case TOOLS.CIRCLE:
        case TOOLS.RECTANGLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW:
        case TOOLS.LINE: {
          const newElement = {
            id: elementId,
            ownerId: userId,
            type: activeTool.id,
            x1: clientX,
            y1: clientY,
            x2: clientX,
            y2: clientY,
            strokeWidth: toolBoxState[activeTool.name].size,
            color: toolBoxState[activeTool.name].stroke,
            fill: toolBoxState[activeTool.name].fillcolor,
            fillStyle: toolBoxState[activeTool.name].fillStyle,
            roughElement: createTool(
              activeTool.id,
              clientX,
              clientY,
              clientX,
              clientY,
              toolBoxState[activeTool.name].stroke,
              toolBoxState[activeTool.name].size,
              toolBoxState[activeTool.name].fillcolor,
              toolBoxState[activeTool.name].fillStyle,
            ),
          };

          currentElementIdRef.current = elementId;
          drawStartElementRef.current = null; // New element
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_DOWN,
            payload: newElement,
          });
          break;
        }
        case TOOLS.ERASER: {
          currentElementIdRef.current = null;
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_DOWN,
            payload: { type: activeTool, x1: clientX, y1: clientY },
          });
          break;
        }
        case TOOLS.TEXT: {
          const newElement = {
            id: elementId,
            ownerId: userId,
            type: activeTool.id,
            left: clientX,
            top: clientY,
            x1: clientX,
            y1: clientY,
            text: '',
            fontSize: toolBoxState[activeTool.name].fontSize,
            color: toolBoxState[activeTool.name].stroke,
          };

          currentElementIdRef.current = elementId;
          drawStartElementRef.current = null; // New element
          dispatchBoardAction({
            type: ALLOWED_METHODS.ADD_TEXT,
            payload: newElement,
          });
          break;
        }
        default:
          break;
      }
    },
    [
      activeTool,
      ToolActionType,
      toolBoxState,
      dispatchBoardAction,
    ],
  );

  const handleMouseMove = useCallback(
    (event) => {
      const { clientX, clientY } = event;
      if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
        return;
      }
      if (ToolActionType === TOOL_ACTION_TYPE.DRAW || ToolActionType === TOOL_ACTION_TYPE.ERASE) {
        switch (activeTool) {
          case TOOLS.PENCIL: {
            if (event.buttons !== 1) return;

            // Collect points for batching
            const newPoint = [event.pageX, event.pageY, event.pressure || 0.5];
            pendingPointsRef.current.push(newPoint);

            // Store latest event data for the RAF callback
            lastMoveDataRef.current = {
              strokeWidth: toolBoxState[activeTool.name].size,
              color: toolBoxState[activeTool.name].stroke,
              thinning: toolBoxState[activeTool.name].thinning,
              smoothing: toolBoxState[activeTool.name].smoothing,
              streamline: toolBoxState[activeTool.name].streamline,
            };

            // Use requestAnimationFrame to batch updates
            if (!rafIdRef.current) {
              rafIdRef.current = requestAnimationFrame(() => {
                const pointsToAdd = [...pendingPointsRef.current];
                const moveData = lastMoveDataRef.current;
                pendingPointsRef.current = [];
                rafIdRef.current = null;

                if (pointsToAdd.length === 0 || !moveData) return;

                dispatchBoardAction({
                  type: ALLOWED_METHODS.DRAW_MOVE,
                  payload: {
                    type: activeTool,
                    points: pointsToAdd,
                    strokeWidth: moveData.strokeWidth,
                    color: moveData.color,
                    thinning: moveData.thinning,
                    smoothing: moveData.smoothing,
                    streamline: moveData.streamline,
                  },
                });
              });
            }
            break;
          }
          case TOOLS.CIRCLE:
          case TOOLS.RECTANGLE:
          case TOOLS.DIAMOND:
          case TOOLS.ARROW:
          case TOOLS.LINE: {
            dispatchBoardAction({
              type: ALLOWED_METHODS.DRAW_MOVE,
              payload: {
                type: activeTool,
                x2: clientX,
                y2: clientY,
                color: toolBoxState[activeTool.name].stroke,
                strokeWidth: toolBoxState[activeTool.name].size,
                fill: toolBoxState[activeTool.name]?.fillcolor,
                fillStyle: toolBoxState[activeTool.name]?.fillStyle,
              },
            });
            break;
          }
          case TOOLS.ERASER: {
            // Find element to erase
            const elementToRemove = elementsRef.current.find((element) =>
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
            break;
          }
          default:
            break;
        }
      }
    },
    [
      activeTool,
      ToolActionType,
      toolBoxState,
      record,
      dispatchBoardAction,
    ],
  );

  const handleMoveUp = useCallback(() => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
      return;
    }
    if (ToolActionType === TOOL_ACTION_TYPE.DRAW || ToolActionType === TOOL_ACTION_TYPE.ERASE) {
      // Cancel any pending animation frame and flush remaining points
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Flush any remaining pending points for pencil
      if (activeTool === TOOLS.PENCIL && pendingPointsRef.current.length > 0) {
        const pointsToAdd = [...pendingPointsRef.current];
        const moveData = lastMoveDataRef.current;
        pendingPointsRef.current = [];

        if (pointsToAdd.length > 0 && moveData) {
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_MOVE,
            payload: {
              type: activeTool,
              points: pointsToAdd,
              strokeWidth: moveData.strokeWidth,
              color: moveData.color,
              thinning: moveData.thinning,
              smoothing: moveData.smoothing,
              streamline: moveData.streamline,
            },
          });
        }
      }

      // Record to history if we were drawing (not erasing)
      if (currentElementIdRef.current && activeTool !== TOOLS.ERASER) {
        // Get the final element from BoardContext
        const finalElement = elementsRef.current.find((e) => e.id === currentElementIdRef.current);

        if (finalElement) {
          // Record: before = null (didn't exist), after = final element
          record({
            before: null,
            after: { element: stripForHistory(finalElement) },
            elementId: finalElement.id,
          });
        }
      }

      // Reset refs
      lastMoveDataRef.current = null;
      currentElementIdRef.current = null;
      drawStartElementRef.current = null;

      dispatchBoardAction({
        type: ALLOWED_METHODS.DRAW_UP,
        payload: TOOL_ACTION_TYPE.NONE,
      });
    }
  }, [ToolActionType, activeTool, record, dispatchBoardAction]);

  const textAreaBlur = useCallback(
    (textValue) => {
      // Record text to history
      if (currentElementIdRef.current) {
        const finalElement = elementsRef.current.find((e) => e.id === currentElementIdRef.current);
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
    [record, dispatchBoardAction],
  );

  // Undo - navigates history and applies patch
  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    // Execute undo in history (this sets lastPatch which triggers the useEffect above)
    historyUndo();
  }, [canUndo, historyUndo]);

  // Redo - navigates history and applies patch
  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    // Execute redo in history (this sets lastPatch which triggers the useEffect above)
    historyRedo();
  }, [canRedo, historyRedo]);

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
