import { useLayoutEffect } from 'react';
import rough from 'roughjs';
import { TOOLS } from '../utils/constants';

/**
 * Custom hook to handle canvas drawing/rendering
 * Optimized for performance with proper context state management
 */
export const useCanvasDraw = (canvasRef, elements, updateSourceRef) => {
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    const rc = rough.canvas(canvas);

    elements.forEach((element) => {
      if (!element) return;

      if (element.type === TOOLS.TEXT.id) {
        context.save();
        context.textBaseline = 'top';
        context.font = `${element.fontSize}px Arial`;
        context.fillStyle = element.color;
        context.fillText(element.text, element.left, element.top);
        context.restore();
      } else if (element.type === TOOLS.PENCIL.id) {
        const drawingPath = element.roughElement;
        if (drawingPath) {
          context.save();
          const myPath = new Path2D(drawingPath);
          context.fillStyle = element.color || '#000';
          context.fill(myPath);
          context.restore();
        }
      } else if (element.roughElement) {
        rc.draw(element.roughElement);
      }
    });
  }, [elements, canvasRef, updateSourceRef]);
};
