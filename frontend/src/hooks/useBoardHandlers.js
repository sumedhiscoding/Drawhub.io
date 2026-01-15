import React, { useCallback, useContext, useRef, useEffect } from 'react';
import { BoardContext } from '../store/Context/BoardContext';
import { useHistory } from '../store/History';
import {
  CANVAS_COMMANDS,
  DEFAULT_NAMESPACE,
  SOURCE_TYPES,
  TOOL_ACTION_TYPE,
  TOOLS,
  generateElementId,
  getLocalUserId,
  ALLOWED_METHODS,
} from '../utils/constants';
import ToolboxContext from '../store/Context/ToolBoxContext';
import useCanvasSocket from './useCanvasSocket';
import { createTool, isPointNearElement } from '../utils/helpers';

/**
 * Handles remote canvas updates from socket
 */
const handleCanvasUpdate = (update, dispatchBoardAction) => {
  if (!update || !update.command) {
    return;
  }

  const { command, elements, payload } = update;

  switch (command) {
    case CANVAS_COMMANDS.DRAW_DOWN:
    case CANVAS_COMMANDS.ADD_TEXT: {
      if (elements && elements.length > 0) {
        const remoteElement = elements[0];
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: remoteElement,
        });
      }
      break;
    }
    case CANVAS_COMMANDS.DRAW_MOVE: {
      const elementId = payload?.elementId || elements?.[0]?.id;
      const movePayload = elements?.[0];

      if (!elementId || !movePayload) {
        break;
      }

      // For remote DRAW_MOVE, we dispatch with element data
      dispatchBoardAction({
        type: ALLOWED_METHODS.DRAW_MOVE,
        payload: movePayload,
      });
      break;
    }
    case CANVAS_COMMANDS.DRAW_UP: {
      dispatchBoardAction({
        type: ALLOWED_METHODS.DRAW_UP,
        payload: TOOL_ACTION_TYPE.NONE,
      });
      break;
    }
    case CANVAS_COMMANDS.ERASE_ELEMENT: {
      if (elements && elements.length > 0) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.ERASE_ELEMENT,
          payload: elements[0],
        });
      }
      break;
    }
    case CANVAS_COMMANDS.SAVE_TEXT: {
      if (payload?.text !== undefined) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.SAVE_TEXT,
          payload: { text: payload.text },
        });
      }
      break;
    }
    case CANVAS_COMMANDS.UNDO: {
      if (payload?.elementId) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.REMOTE_UNDO,
          payload: { elementId: payload.elementId },
        });
      }
      break;
    }
    case CANVAS_COMMANDS.REDO: {
      if (payload?.element) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.REMOTE_REDO,
          payload: { element: payload.element },
        });
      }
      break;
    }
    default:
      console.warn('Unknown canvas command:', command);
  }
};
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
export const useBoardHandlers = ({ canvasId, updateSourceRef }) => {
  const { activeTool, ToolActionType, elements, dispatchBoardAction } = useContext(BoardContext);
  const { toolBoxState } = useContext(ToolboxContext);
  const history = useHistory();

  const { canUndo, canRedo, record, undo: historyUndo, redo: historyRedo, lastPatch } = history;

  // Wrapper that passes dispatchBoardAction to handleCanvasUpdate
  const onCanvasUpdate = useCallback(
    (update) => {
      handleCanvasUpdate(update, dispatchBoardAction);
    },
    [dispatchBoardAction],
  );

  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Track the element being drawn (for recording to history on DRAW_UP)
  const currentElementIdRef = useRef(null);
  const drawStartElementRef = useRef(null); // Store the element state at start

  const handleSyncState = useCallback(
    (syncData) => {
      if (!syncData?.elements) {
        return;
      }

      if (updateSourceRef) {
        updateSourceRef.current = SOURCE_TYPES.REMOTE;
      }
      dispatchBoardAction({
        type: ALLOWED_METHODS.SET_ELEMENTS,
        payload: syncData.elements,
      });
    },
    [dispatchBoardAction, updateSourceRef],
  );

  const getSyncState = useCallback(() => {
    return { elements: elementsRef.current || [] };
  }, []);

  const { emitCanvasUpdate, connectionState, isInRoom, joinCanvasRoom, leaveCanvasRoom } =
    useCanvasSocket({
      canvasId,
      namespace: DEFAULT_NAMESPACE,
      onCanvasUpdate,
      updateSourceRef,
      getSyncState,
      onSyncState: handleSyncState,
      autoJoin: false,
      autoSync: true,
    });

  const markLocalUpdate = useCallback(() => {
    if (updateSourceRef) {
      updateSourceRef.current = SOURCE_TYPES.LOCAL;
    }
  }, [updateSourceRef]);

  // Apply patches from undo/redo
  useEffect(() => {
    if (lastPatch && lastPatch.patch !== undefined) {
      dispatchBoardAction({
        type: ALLOWED_METHODS.APPLY_PATCH,
        payload: {
          patch: lastPatch.patch,
          elementId: lastPatch.elementId,
        },
      });
    }
  }, [lastPatch, dispatchBoardAction]);

  // Throttling refs for smooth drawing
  const rafIdRef = useRef(null);
  const pendingPointsRef = useRef([]);
  const lastMoveDataRef = useRef(null);

  const handleMouseDown = useCallback(
    (event) => {
      markLocalUpdate();
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
          emitCanvasUpdate({
            command: CANVAS_COMMANDS.DRAW_DOWN,
            elements: [newElement],
            source: SOURCE_TYPES.LOCAL,
            updatedBy: userId,
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
          emitCanvasUpdate({
            command: CANVAS_COMMANDS.DRAW_DOWN,
            elements: [newElement],
            source: SOURCE_TYPES.LOCAL,
            updatedBy: userId,
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
          emitCanvasUpdate({
            command: CANVAS_COMMANDS.ADD_TEXT,
            elements: [newElement],
            source: SOURCE_TYPES.LOCAL,
            updatedBy: userId,
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
      markLocalUpdate,
      dispatchBoardAction,
      emitCanvasUpdate,
    ],
  );

  const handleMouseMove = useCallback(
    (event) => {
      markLocalUpdate();
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
                emitCanvasUpdate({
                  command: CANVAS_COMMANDS.DRAW_MOVE,
                  elements: [
                    {
                      type: activeTool.id,
                      points: pointsToAdd,
                      strokeWidth: moveData.strokeWidth,
                      color: moveData.color,
                      thinning: moveData.thinning,
                      smoothing: moveData.smoothing,
                      streamline: moveData.streamline,
                      id: currentElementIdRef.current,
                    },
                  ],
                  source: SOURCE_TYPES.LOCAL,
                  updatedBy: getLocalUserId(),
                  payload: {
                    elementId: currentElementIdRef.current,
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
            emitCanvasUpdate({
              command: CANVAS_COMMANDS.DRAW_MOVE,
              elements: [
                {
                  type: activeTool.id,
                  x2: clientX,
                  y2: clientY,
                  color: toolBoxState[activeTool.name].stroke,
                  strokeWidth: toolBoxState[activeTool.name].size,
                  fill: toolBoxState[activeTool.name]?.fillcolor,
                  fillStyle: toolBoxState[activeTool.name]?.fillStyle,
                  id: currentElementIdRef.current,
                },
              ],
              source: SOURCE_TYPES.LOCAL,
              updatedBy: getLocalUserId(),
              payload: {
                elementId: currentElementIdRef.current,
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
              emitCanvasUpdate({
                command: CANVAS_COMMANDS.ERASE_ELEMENT,
                elements: [{ x1: clientX, y1: clientY }],
                source: SOURCE_TYPES.LOCAL,
                updatedBy: getLocalUserId(),
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
      markLocalUpdate,
      record,
      dispatchBoardAction,
      emitCanvasUpdate,
    ],
  );

  const handleMoveUp = useCallback(() => {
    markLocalUpdate();
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
      emitCanvasUpdate({
        command: CANVAS_COMMANDS.DRAW_UP,
        elements: [],
        source: SOURCE_TYPES.LOCAL,
        updatedBy: getLocalUserId(),
      });
    }
  }, [ToolActionType, activeTool, markLocalUpdate, record, dispatchBoardAction, emitCanvasUpdate]);

  const textAreaBlur = useCallback(
    (textValue) => {
      markLocalUpdate();

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
      emitCanvasUpdate({
        command: CANVAS_COMMANDS.SAVE_TEXT,
        elements: [],
        source: SOURCE_TYPES.LOCAL,
        updatedBy: getLocalUserId(),
        payload: { text: textValue },
      });
    },
    [markLocalUpdate, record, dispatchBoardAction, emitCanvasUpdate],
  );

  // Undo - navigates history and applies patch
  const handleUndo = useCallback(() => {
    markLocalUpdate();

    if (!canUndo) return;

    // Get the element that will be undone (for broadcasting)
    const currentNode = history.historySize > 0 ? elementsRef.current : null;

    // Execute undo in history (this sets lastPatch which triggers the useEffect above)
    historyUndo();

    // Broadcast to other users (we'll get the elementId from the patch)
    // Note: The actual patch application happens via the useEffect above
  }, [canUndo, markLocalUpdate, historyUndo, history.historySize]);

  // Redo - navigates history and applies patch
  const handleRedo = useCallback(() => {
    markLocalUpdate();

    if (!canRedo) return;

    // Execute redo in history (this sets lastPatch which triggers the useEffect above)
    historyRedo();
  }, [canRedo, markLocalUpdate, historyRedo]);

  // Broadcast undo/redo when lastPatch changes
  useEffect(() => {
    if (!lastPatch) return;

    const userId = getLocalUserId();

    if (lastPatch.action === 'undo') {
      emitCanvasUpdate({
        command: CANVAS_COMMANDS.UNDO,
        elements: [],
        source: SOURCE_TYPES.LOCAL,
        updatedBy: userId,
        payload: {
          elementId: lastPatch.elementId,
          userId: userId,
        },
      });
    } else if (lastPatch.action === 'redo') {
      emitCanvasUpdate({
        command: CANVAS_COMMANDS.REDO,
        elements: [],
        source: SOURCE_TYPES.LOCAL,
        updatedBy: userId,
        payload: {
          element: lastPatch.patch?.element,
        },
      });
    }
  }, [lastPatch, emitCanvasUpdate]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMoveUp,
    textAreaBlur,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    connectionState,
    isInRoom,
    joinCanvasRoom,
    leaveCanvasRoom,
  };
};
