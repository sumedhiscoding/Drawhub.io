import { useLayoutEffect } from "react";
import rough from "roughjs";
import { TOOLS } from "../utils/constants";

/**
 * Custom hook to handle canvas drawing/rendering
 */
export const useCanvasDraw = (canvasRef, elements) => {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    const rc = rough.canvas(canvas);

    elements.forEach((element) => {
      if (element?.type == TOOLS.TEXT.id) {
        context.textBaseline = "top";
        context.font = `${element.fontSize}px Arial`;
        context.fillStyle = element.color;
        context.fillText(element.text, element.left, element.top);
        context.restore();
        return;
      } else if (element.type === TOOLS.PENCIL.id) {
        console.log("Drawing pencil element", element);
        const drawingPath = element.roughElement;
        const myPath = new Path2D(drawingPath);
        context.fillStyle = element.color || "#000";
        context.fill(myPath);
        context.restore();
        return;
      } else {
        rc.draw(element.roughElement);
      }
    });
  }, [elements, canvasRef]);
};
