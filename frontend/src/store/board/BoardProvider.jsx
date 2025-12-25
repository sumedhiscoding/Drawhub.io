import React from "react";
import { BoardContext } from "./board-context.jsx";
import {
  ALLOWED_METHODS,
  TOOL_ACTION_TYPE,
  TOOLS,
} from "../../utils/constants";
import rough from "roughjs";
import { createTool } from "../../utils/helpers.jsx";
const generator = rough.generator();
const BoardReducer = (state, action) => {
  const { elements, activeTool } = state;
   console.log("meowww",state, action.payload);
  switch (action.type) {
    // Define reducer cases if needed in the future
    case ALLOWED_METHODS.DRAW_DOWN: {     
      const { x1, y1 ,color, strokeWidth, fillStyle ,fill } = action.payload;
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
          generator,
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
    case ALLOWED_METHODS.DRAW_MOVE: {
      const { x2, y2  } = action.payload;
      const index = elements.length - 1;
      // const{color, strokeWidth, fillStyle, fill}=elements[index];
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
          elements[index]?.strokeWidth,
          generator,
          elements[index]?.fill,
          elements[index]?.fillStyle
        ),
      };
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      return { ...state, elements: updatedElements };
    }
    case ALLOWED_METHODS.DRAW_UP: {
      return {
        ...state,
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

    default:
      return state;
  }
};

const initialBoardState = {
  // Define initial state properties if needed in the future
  elements: [],
  activeTool: TOOLS.LINE,
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

  const boardContextValue = {
    elements: BoardState.elements,
    activeTool: BoardState.activeTool,
    color: BoardState.color,
    strokeWidth: BoardState.strokeWidth,
    dispatchBoardAction,
    ALLOWED_METHODS,
    setActiveTool,
    ToolActionType: BoardState.ToolActionType,
  };

  return (
    <BoardContext.Provider value={boardContextValue}>
      {children}
    </BoardContext.Provider>
  );
};

export default BoardProvider;
