import React, { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { BoardContext } from "../../store/board/board-context";
import { TOOL_ACTION_TYPE, TOOLS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";

const Board = () => {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);

  const {
    elements,
    activeTool,
    ToolActionType,
    dispatchBoardAction,
    ALLOWED_METHODS,
  } = React.useContext(BoardContext);

  const { toolBoxState } = React.useContext(toolboxContext);

  useEffect(() => {
  const canvas = canvasRef.current;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const context = canvas.getContext("2d");
  context.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transforms
  context.scale(dpr, dpr); // Scale for high-DPI
  canvas.style.backgroundColor = "#fdfdfd";
  return () => {};
}, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
    const rc = rough.canvas(canvas);
    console.log("Rendering elements:", elements, elements.length);
    elements.forEach((element) => {
      if (element?.type == TOOLS.TEXT.id) {
        console.log("Rendering TEXT element:", element);
        context.textBaseline = 'top';
        context.font = `${element.fontSize}px Arial`;
        context.fillStyle = element.color;
        context.fillText(element.text, element.left, element.top);
        context.restore();
        return;
      } else if (element.type === TOOLS.PENCIL.id) {
        const drawingPath = element.roughElement;
        const myPath = new Path2D(drawingPath);
        context.fill(myPath);
        context.restore();
        return;
      } else {
        rc.draw(element.roughElement);
      }
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  useEffect(() => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current.focus();
      }, 0);
    }
  }, [ToolActionType]);

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
        console.log("TEXT TOOL SELECTED");
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
          };
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
          console.log("ERASER MOVING", newElement);
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
    console.log("Mouse Up Event", ToolActionType);
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
        <textarea
          className="text-input-container"
          ref={textAreaRef}
          style={{
            position: "absolute",
            left: elements[elements.length - 1]?.left || 0,
            top: elements[elements.length - 1]?.top || 0,
            fontSize: `${toolBoxState[activeTool.name]?.fontSize || 16}px`,
            color: toolBoxState[activeTool.name]?.stroke || "#000",
            background: "transparent",
            outline: "black",
            border: "1px solid #ccc",
            minWidth: "100px",
            minHeight: "30px",
            zIndex: 10,
          }}
          type="text"
          placeholder=""
          onBlur={(e) => {
            const textValue = e.target.value;
           return textAreaBlur(textValue);
          }}
        ></textarea>
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
