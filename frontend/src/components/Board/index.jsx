import clsx from "clsx";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import { BoardContext } from "../../store/board/board-context";
import { TOOL_ACTION_TYPE } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";

const Board = () => {
  const canvasRef = useRef(null);
  const { elements, activeTool,ToolActionType, dispatchBoardAction, ALLOWED_METHODS } =
    React.useContext(BoardContext);

  const {toolBoxState,dispatchToolBoxAction}=React.useContext(toolboxContext);
  console.log("Board Rendered with elements:", toolBoxState);  
    
  useEffect(() => {

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.backgroundColor = "#FFFDD0";
    return () => {
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
    const rc = rough.canvas(canvas);
    const generator = rc.generator;

    elements.forEach((element) => {
      rc.draw(element.roughElement);
    });

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    const newElement = {
      type: activeTool,
      x1: clientX,
      y1: clientY,
      strokeWidth: toolBoxState[activeTool.name].size,
      color: toolBoxState[activeTool.name].stroke,
      fill: toolBoxState[activeTool.name].fillcolor,
      fillStyle: toolBoxState[activeTool.name].fillStyle
    };
    console.log("Mouse Down New Element:", newElement);
    dispatchBoardAction({
      type: ALLOWED_METHODS.DRAW_DOWN,
      payload: newElement,
    });
  };
  const handleMouseMove = (event) => {
    // Future implementation for drawing
    if (ToolActionType == TOOL_ACTION_TYPE.DRAW) {
      const { clientX, clientY } = event;
      const newElement = {
        type: activeTool,
        x2: clientX,
        y2: clientY,
        color: toolBoxState[activeTool.name].stroke,
        strokeWidth: toolBoxState[activeTool.name].size, 
        fill: toolBoxState[activeTool.name].fillcolor,
        fillStyle: toolBoxState[activeTool.name].fillStyle
      };
      dispatchBoardAction({
        type: ALLOWED_METHODS.DRAW_MOVE,
        payload: newElement,
      });
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
