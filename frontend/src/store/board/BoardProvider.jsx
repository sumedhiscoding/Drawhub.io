import React from "react";
import { BoardContext } from "./board-context.jsx";
import {
  ALLOWED_METHODS,
  TOOL_ACTION_TYPE,
  TOOLS,
} from "../../utils/constants";
import rough from "roughjs";
import { createTool, isPointNearElement } from "../../utils/helpers.jsx";
const BoardReducer = (state, action) => {
  const generator = rough.generator();
  const { elements, activeTool } = state;
  switch (action.type) {
    // Define reducer cases if needed in the future
    case ALLOWED_METHODS.DRAW_DOWN: {
      switch (state.activeTool) {
        case TOOLS.PENCIL: {
          const {
            points,
            color,
            strokeWidth,
            thinning,
            smoothing,
            streamline,
          } = action.payload;
          console.log("DRAW_DOWN action payload:", action.payload);
          const activeToolId = activeTool?.id;
          const newElement = {
            type: activeToolId,
            points: points,
            color: color,
            strokeWidth: strokeWidth,
            roughElement: createTool(
              activeToolId,
              0,
              0,
              0,
              0,
              color,
              points,
              strokeWidth,
              null,
              null,
              thinning,
              smoothing,
              streamline
            ),
          };
          return {
            ...state,
            ToolActionType: TOOL_ACTION_TYPE.DRAW,
            elements: [...elements, newElement],
          };
        }
        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.CIRCLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW: {
          const { x1, y1, color, strokeWidth, fill, fillStyle } =
            action.payload;
          const activeToolId = activeTool?.id;

          const newElement = {
            type: activeToolId,
            x1: x1,
            y1: y1,
            x2: x1,
            y2: y1,
            color: color,
            strokeWidth: strokeWidth,
            fill: fill,
            fillStyle: fillStyle,
            roughElement: createTool(
              activeToolId,
              x1,
              y1,
              x1,
              y1,
              color,
              strokeWidth,
              fill,
              fillStyle
            ),
          };
          return {
            ...state,
            ToolActionType: TOOL_ACTION_TYPE.DRAW,
            elements: [...elements, newElement],
          };
        }
        case TOOLS.ERASER: {
          console.log("ehasdfasdf1");
          return { ...state, ToolActionType: TOOL_ACTION_TYPE.ERASE };
        }
        default:
          break;
      }
    }
    case ALLOWED_METHODS.DRAW_MOVE: {
      switch (state.activeTool) {
        case TOOLS.PENCIL: {
          const { points } = action.payload;
          const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
          const activeToolId = activeTool?.id;
          // Flatten the points array
          const newPoints = [...elements[index].points, ...points];
          const updatedElement = {
            ...elements[index],
            points: newPoints,
            roughElement: createTool(
              activeToolId,
              elements[index]?.x1,
              elements[index]?.y1,
              elements[index]?.x2,
              elements[index]?.y2,
              elements[index]?.color,
              newPoints,
              elements[index]?.strokeWidth,
              elements[index]?.fill,
              elements[index]?.fillStyle,
              elements[index]?.thinning,
              elements[index]?.smoothing,
              elements[index]?.streamline
            ),
          };
          const updatedElements = [...elements];
          updatedElements[index] = updatedElement;
          return { ...state, elements: updatedElements };
        }
        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.CIRCLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW: {
          const { x2, y2 } = action.payload;
          const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
          const activeToolId = activeTool?.id;
          const updatedElement = {
            ...elements[index],
            x2: x2,
            y2: y2,
            roughElement: createTool(
              activeToolId,
              elements[index]?.x1,
              elements[index]?.y1,
              x2,
              y2,
              elements[index]?.color,
              [],
              elements[index]?.strokeWidth,
              elements[index]?.fill,
              elements[index]?.fillStyle
            ),
          };
          const updatedElements = [...elements];
          updatedElements[index] = updatedElement;
          return { ...state, elements: updatedElements };
        }
        default:
          break;
      }
    }
    case ALLOWED_METHODS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return {
        ...state,
        history: newHistory,
        index: newHistory.length - 1,
        ToolActionType: TOOL_ACTION_TYPE.NONE,
      };
    }
    case ALLOWED_METHODS.SET_ACTIVE_TOOL: {
      return { ...state, activeTool: TOOLS[action.payload.name] };
    }
    case ALLOWED_METHODS.SET_COLOR: {
      return { ...state, color: action.payload };
    }
    case ALLOWED_METHODS.SET_STROKE_WIDTH: {
      return { ...state, strokeWidth: action.payload };
    }
    case ALLOWED_METHODS.CLEAR_BOARD: {
      return { ...state, elements: [] };
    }
    case ALLOWED_METHODS.ERASE_ELEMENT: {
      const { x1, y1 } = action.payload;
      const filteredElements = elements.filter(
        (element) => !isPointNearElement(x1, y1, element)
      );
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(filteredElements);
      return {
        ...state,
        history: newHistory,
        index: newHistory.length - 1,
        elements: filteredElements,
      };
    }
    case ALLOWED_METHODS.ADD_TEXT: {
      const { x1, y1, text, fontSize, color } = action.payload;
      const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
      const updatedElement = {
        type: activeTool.id,
        ...elements[index],
        left: x1,
        top: y1,
        text: text,
        fontSize: fontSize,
        color: color,
      };
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      console.log("ADD_TEXT action payload:", updatedElements);

      return {
        ...state,
        ToolActionType: TOOL_ACTION_TYPE.WRITE,
        elements: [...elements, updatedElement],
      };
    }
    case ALLOWED_METHODS.SAVE_TEXT: {
      const textValue = action.payload;
      const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
      const updatedElement = {
        ...elements[index],
        text: textValue,
      };
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(updatedElements);
      return {
        ...state,
        history: newHistory,
        index: newHistory.length - 1,
        ToolActionType: TOOL_ACTION_TYPE.NONE,
        elements: updatedElements,
      };
    }
    case ALLOWED_METHODS.UNDO: {
  if (state.index === 0) return state;
  const newIndex = state.index - 1;
  return {
    ...state,
    index: newIndex,
    elements: state.history[newIndex] || [],
  };
}
    case ALLOWED_METHODS.REDO: {
  if (state.index >= state.history.length - 1) return state;
  const newIndex = state.index + 1;
  return {
    ...state,
    index: newIndex,
    elements: state.history[newIndex] || [],
  };
}
    default:
      return state;
  }
};

const initialBoardState = {
  elements: [],
  activeTool: TOOLS.LINE,
  history: [[]],
  index: 0,
  color: "black",
  strokeWidth: 1,
  ToolActionType: TOOL_ACTION_TYPE.NONE,
};

const BoardProvider = ({ children }) => {
  const [BoardState, dispatchBoardAction] = React.useReducer(
    BoardReducer,
    initialBoardState
  );

  const setActiveTool = (tool) =>
    dispatchBoardAction({
      type: ALLOWED_METHODS.SET_ACTIVE_TOOL,
      payload: {
        name: tool,
      },
    });

  const boardUndoHandler = () => {
    console.log("Undo handler called");
    dispatchBoardAction({
      type: ALLOWED_METHODS.UNDO,
    });
  };
  const boardRedoHandler = () => {
    console.log("Redo handler called");
    dispatchBoardAction({
      type: ALLOWED_METHODS.REDO,
    });
  };

  const boardContextValue = {
    elements: BoardState.elements,
    activeTool: BoardState.activeTool,
    color: BoardState.color,
    strokeWidth: BoardState.strokeWidth,
    dispatchBoardAction,
    ALLOWED_METHODS,
    setActiveTool,
    ToolActionType: BoardState.ToolActionType,
    boardUndoHandler,
    boardRedoHandler,
  };

  return (
    <BoardContext.Provider value={boardContextValue}>
      {children}
    </BoardContext.Provider>
  );
};

export default BoardProvider;
