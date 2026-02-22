import { useCallback } from 'react';
import { TOOLS, ALLOWED_METHODS } from '../utils/constants';

/**
 * Hook to handle pencil drawing with RAF throttling
 * Batches points and dispatches in animation frames for smooth drawing
 * 
 * @param {Object} refs - Drawing refs from useDrawingRefs
 * @param {Function} dispatchBoardAction - Board action dispatcher
 * @returns {Object} Pencil move and flush handlers
 */
export const usePencilThrottle = (refs, dispatchBoardAction) => {
  const { rafIdRef, pendingPointsRef, lastMoveDataRef } = refs;

  // Create pencil move payload (reusable)
  const createPencilPayload = useCallback((points, styles) => ({
    type: TOOLS.PENCIL,
    points,
    strokeWidth: styles.size,
    color: styles.stroke,
    thinning: styles.thinning,
    smoothing: styles.smoothing,
    streamline: styles.streamline,
  }), []);

  // Handle pencil move with RAF throttling
  const handlePencilMove = useCallback((event, styles) => {
    if (event.buttons !== 1) return;

    // Collect point for batching
    const newPoint = [event.pageX, event.pageY, event.pressure || 0.5];
    pendingPointsRef.current.push(newPoint);

    // Store latest styles for RAF callback
    lastMoveDataRef.current = styles;

    // Schedule RAF if not already pending
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        const pointsToAdd = [...pendingPointsRef.current];
        const moveData = lastMoveDataRef.current;
        pendingPointsRef.current = [];
        rafIdRef.current = null;

        if (pointsToAdd.length === 0 || !moveData) return;

        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_MOVE,
          payload: createPencilPayload(pointsToAdd, moveData),
        });
      });
    }
  }, [pendingPointsRef, lastMoveDataRef, rafIdRef, dispatchBoardAction, createPencilPayload]);

  // Flush any pending points (call on mouse up)
  const flushPendingPoints = useCallback(() => {
    // Cancel pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Flush remaining points
    if (pendingPointsRef.current.length > 0) {
      const pointsToAdd = [...pendingPointsRef.current];
      const moveData = lastMoveDataRef.current;
      pendingPointsRef.current = [];

      if (pointsToAdd.length > 0 && moveData) {
        dispatchBoardAction({
          type: ALLOWED_METHODS.DRAW_MOVE,
          payload: createPencilPayload(pointsToAdd, moveData),
        });
      }
    }
  }, [rafIdRef, pendingPointsRef, lastMoveDataRef, dispatchBoardAction, createPencilPayload]);

  return {
    handlePencilMove,
    flushPendingPoints,
    createPencilPayload,
  };
};

export default usePencilThrottle;
