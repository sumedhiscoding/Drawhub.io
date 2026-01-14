import React, { useRef } from "react";
import { BoardContext } from "../../store/board/board-context";
import { useParams } from "react-router";
import { TOOL_ACTION_TYPE, TOOLS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";
import { Textarea } from "@/components/ui/textarea";
import { useCanvasSetup } from "../../hooks/useCanvasSetup";
import { useCanvasFetch } from "../../hooks/useCanvasFetch";
import { useCanvasUpdate } from "../../hooks/useCanvasUpdate";
import { useCanvasDraw } from "../../hooks/useCanvasDraw";
import { useTextAreaFocus } from "../../hooks/useTextAreaFocus";

const Board = () => {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const { id: canvasId } = useParams();
  
  const {
    elements,
    activeTool,
    ToolActionType,
    dispatchBoardAction,
    ALLOWED_METHODS,
  } = React.useContext(BoardContext);

  const { toolBoxState } = React.useContext(toolboxContext);

  // Setup canvas with window size
  useCanvasSetup(canvasRef);

  // Fetch canvas data
  const isInitialLoad = useCanvasFetch(
    canvasId,
    dispatchBoardAction,
    ALLOWED_METHODS
  );

  // Update canvas with debouncing
  useCanvasUpdate(canvasId, elements, isInitialLoad);

  // Draw elements on canvas
  useCanvasDraw(canvasRef, elements);

  // Focus textarea when in WRITE mode
  useTextAreaFocus(textAreaRef, ToolActionType);

  const handleMouseDown = (event) => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
      return;
    }
    const { clientX, clientY } = event;
    let newElement = {};
    switch (activeTool) {
      case TOOLS.PENCIL: {
        newElement = {
          type: activeTool,
          points: [[event.pageX, event.pageY, event.pressure || 0.5]],
          strokeWidth: toolBoxState[activeTool.name].size,
          color: toolBoxState[activeTool.name].stroke,
          thinning: toolBoxState[activeTool.name].thinning,
          smoothing: toolBoxState[activeTool.name].smoothing,
          streamline: toolBoxState[activeTool.name].streamline,
        };
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
        newElement = {
          type: activeTool,
          x1: clientX,
          y1: clientY,
          strokeWidth: toolBoxState[activeTool.name].size,
          color: toolBoxState[activeTool.name].stroke,
          fill: toolBoxState[activeTool.name].fillcolor,
          fillStyle: toolBoxState[activeTool.name].fillStyle,
        };
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: newElement,
        });
        break;
      }
      case TOOLS.ERASER: {
        newElement = {
          type: activeTool,
          x1: clientX,
          y1: clientY,
        };
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_DOWN,
          payload: newElement,
        });
        break;
      }
      case TOOLS.TEXT: {
        newElement = {
          type: activeTool,
          x1: clientX,
          y1: clientY,
          text: "",
          fontSize: toolBoxState[activeTool.name].fontSize,
          color: toolBoxState[activeTool.name].stroke,
        };
        dispatchBoardAction({
          type: ALLOWED_METHODS.ADD_TEXT,
          payload: newElement,
        });
      }
      default:
        break;
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
      return;
    }
    if (
      ToolActionType == TOOL_ACTION_TYPE.DRAW ||
      ToolActionType == TOOL_ACTION_TYPE.ERASE
    ) {
      switch (activeTool) {
        case TOOLS.PENCIL: {
          if (event.buttons !== 1) return;
          const newElement = {
            type: activeTool,
            points: [[event.pageX, event.pageY, event.pressure]],
            strokeWidth: toolBoxState[activeTool.name].size,
            color: toolBoxState[activeTool.name].stroke,
            thinning: toolBoxState[activeTool.name].thinning,
            smoothing: toolBoxState[activeTool.name].smoothing,
            streamline: toolBoxState[activeTool.name].streamline,
          };
          console.log("newElement is being moved", newElement);
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_MOVE,
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
            type: activeTool,
            x2: clientX,
            y2: clientY,
            color: toolBoxState[activeTool.name].stroke,
            strokeWidth: toolBoxState[activeTool.name].size,
            fill: toolBoxState[activeTool.name]?.fillcolor,
            fillStyle: toolBoxState[activeTool.name]?.fillStyle,
          };
          dispatchBoardAction({
            type: ALLOWED_METHODS.DRAW_MOVE,
            payload: newElement,
          });
          break;
        }
        case TOOLS.ERASER: {
          const newElement = {
            type: activeTool,
            x1: clientX,
            y1: clientY,
          };
          dispatchBoardAction({
            type: ALLOWED_METHODS.ERASE_ELEMENT,
            payload: newElement,
          });
          break;
        }
        default:
          break;
      }
    }
  };

  const handleMoveUp = (event) => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE) {
      return;
    }
    if (
      ToolActionType === TOOL_ACTION_TYPE.DRAW ||
      ToolActionType === TOOL_ACTION_TYPE.ERASE
    ) {
      dispatchBoardAction({
        type: ALLOWED_METHODS.DRAW_UP,
        payload: TOOL_ACTION_TYPE.NONE,
      });
    }
  };

  const textAreaBlur = (textValue) => {
    dispatchBoardAction({
      type: ALLOWED_METHODS.SAVE_TEXT,
      payload: textValue,
    });
  };

  return (
    <>
      {ToolActionType === TOOL_ACTION_TYPE.WRITE ? (
        <Textarea
          className="w-100"
          ref={textAreaRef}
          style={{
            position: "absolute",
            left: elements[elements.length - 1]?.left || 0,
            top: elements[elements.length - 1]?.top || 0,
            fontSize: `${toolBoxState[activeTool.name]?.fontSize || 16}px`,
            color: toolBoxState[activeTool.name]?.stroke || "#000",
            zIndex: 10,
          }}
          type="text"
          placeholder=""
          onBlur={(e) => {
            const textValue = e.target.value;
            return textAreaBlur(textValue);
          }}
        ></Textarea>
      ) : (
        <></>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMoveUp}
      ></canvas>
    </>
  );
};

export default Board;
