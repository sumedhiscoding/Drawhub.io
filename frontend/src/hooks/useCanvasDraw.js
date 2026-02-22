import { useLayoutEffect, useRef, useMemo } from 'react';
import rough from 'roughjs';
import { TOOLS } from '../utils/constants';

/**
 * Custom hook to handle canvas drawing/rendering
 * Optimized for performance with requestAnimationFrame batching
 */
export const useCanvasDraw = (canvasRef, elements) => {
  const rafIdRef = useRef(null);
  const pendingElementsRef = useRef(elements);

  // Create a dependency that changes when elements change
  // Use a combination of length and a hash of the last element's key properties
  const elementsKey = useMemo(() => {
    if (elements.length === 0) return 'empty';
    const lastElement = elements[elements.length - 1];
    if (!lastElement) return `length-${elements.length}`;
    
    // For pencil, include points length in the key for better change detection
    if (lastElement.type === TOOLS.PENCIL.id) {
      return `length-${elements.length}-last-${lastElement.id}-points-${lastElement.points?.length || 0}`;
    }
    // For other elements, use id and key properties
    return `length-${elements.length}-last-${lastElement.id}-${lastElement.x2 || ''}-${lastElement.y2 || ''}`;
  }, [elements]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update pending elements immediately
    pendingElementsRef.current = elements;

    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use requestAnimationFrame for smooth, batched redraws
    // This ensures we redraw at most once per frame (60fps)
    rafIdRef.current = requestAnimationFrame(() => {
      const elementsToDraw = pendingElementsRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Clear and redraw
      context.clearRect(0, 0, canvas.width, canvas.height);
      const rc = rough.canvas(canvas);

      elementsToDraw.forEach((element) => {
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

      rafIdRef.current = null;
    });

    // Cleanup
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [elementsKey, canvasRef, elements]);
};
