import { useRef, useEffect } from 'react';

/**
 * Hook to manage all drawing-related refs
 * Centralizes ref management for drawing operations
 * 
 * @param {Array} elements - Current elements from BoardContext
 * @returns {Object} Refs and reset function
 */
export const useDrawingRefs = (elements) => {
  // Sync elements to ref for access in callbacks without stale closures
  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Track current element being drawn
  const currentElementIdRef = useRef(null);
  
  // Store element state at draw start (for edit operations)
  const drawStartElementRef = useRef(null);
  
  // Track processed patches to prevent infinite loops
  const lastProcessedPatchRef = useRef(null);

  // RAF throttling for smooth drawing
  const rafIdRef = useRef(null);
  const pendingPointsRef = useRef([]);
  const lastMoveDataRef = useRef(null);

  // Reset all drawing refs
  const resetDrawingRefs = () => {
    currentElementIdRef.current = null;
    drawStartElementRef.current = null;
    lastMoveDataRef.current = null;
  };

  // Cancel any pending animation frame
  const cancelPendingRaf = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  // Get current element by ID
  const getCurrentElement = () => {
    if (!currentElementIdRef.current) return null;
    return elementsRef.current.find((e) => e.id === currentElementIdRef.current);
  };

  // Get element by position (for eraser)
  const getElementsRef = () => elementsRef.current;

  return {
    // Element tracking
    currentElementIdRef,
    drawStartElementRef,
    lastProcessedPatchRef,
    
    // RAF throttling
    rafIdRef,
    pendingPointsRef,
    lastMoveDataRef,
    
    // Utilities
    resetDrawingRefs,
    cancelPendingRaf,
    getCurrentElement,
    getElementsRef,
  };
};

export default useDrawingRefs;
