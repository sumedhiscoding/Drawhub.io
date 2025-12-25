import React, { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { BoardContext } from "../../store/board/board-context";
import { TOOL_ACTION_TYPE, TOOLS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";
const Board = () => {
  const canvasRef = useRef(null);
  const {
    elements,
    activeTool,
    ToolActionType,
    dispatchBoardAction,
    ALLOWED_METHODS,
  } = React.useContext(BoardContext);
  const { toolBoxState } = React.useContext(toolboxContext);
  console.log("Board Rendered with elements:", toolBoxState);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.backgroundColor = "#FFFDD0";
    return () => {};
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
    const rc = rough.canvas(canvas);

    elements.forEach((element) => {
      if (element.type === TOOLS.PENCIL.id) {
        console.log("Drawing pencil element:", element);
        const drawingPath = element.roughElement;
        const myPath = new Path2D(drawingPath);
        context.fill(myPath);
        context.restore();
        return;
      } else {
        console.log("Drawing element:", element);
        rc.draw(element.roughElement);
      }
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    let newElement = {};
    switch (activeTool) {
      case TOOLS.PENCIL: {
        newElement = {
          type: activeTool,
          points: [[event.pageX, event.pageY, event.pressure || 0.5]],
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
      default:
        break;
    }
    console.log("Mouse Down New Element:", newElement);
  };

  const handleMouseMove = (event) => {
    if (ToolActionType == TOOL_ACTION_TYPE.DRAW) {
      console.log("Mouse Move Event:", {
        fill: toolBoxState[activeTool.name]?.fillcolor,
        fillStyle: toolBoxState[activeTool.name]?.fillStyle,
      });

      const { clientX, clientY } = event;
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
        default:
          break;
      }
    }
  };

  const handleMoveUp = (event) => {
    dispatchBoardAction({
      type: ALLOWED_METHODS.DRAW_UP,
      payload: TOOL_ACTION_TYPE.NONE,
    });
  };

  return (
    <>
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
