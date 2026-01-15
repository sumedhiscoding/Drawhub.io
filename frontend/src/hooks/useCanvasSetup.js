import { useEffect } from 'react';
import { useWindowSize } from 'rooks';

/**
 * Custom hook to setup canvas with proper dimensions and high-DPI support
 * Uses useWindowSize from rooks to handle window resize
 */
export const useCanvasSetup = (canvasRef) => {
  const { innerWidth, innerHeight } = useWindowSize();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = innerWidth || window.innerWidth;
    const canvasHeight = innerHeight || window.innerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0); // Reset any existing transforms
    context.scale(dpr, dpr); // Scale for high-DPI
    canvas.style.backgroundColor = '#fdfdfd';
  }, [innerWidth, innerHeight, canvasRef]);
};
