import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { SOURCE_TYPES } from '../utils/constants';

/**
 * Custom hook to update canvas data with debouncing
 * Handles both WebSocket real-time sync and HTTP API persistence
 *
 * @param {string} canvasId - Canvas ID
 * @param {Array} elements - Canvas elements
 * @param {Object} isInitialLoad - Ref to track initial load
 */
export const useCanvasUpdate = (canvasId, elements, isInitialLoad, updateSourceRef) => {
  const timeoutRef = useRef(null);
  // Save to database via HTTP API (debounced)
  const updateCanvas = useCallback(async () => {
    if (!canvasId || isInitialLoad.current) {
      return;
    }

    if (updateSourceRef?.current === SOURCE_TYPES.REMOTE) {
      return;
    }
    const payload = {
      elements: elements,
    };
    const token = localStorage.getItem('token');

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/canvas/update/${canvasId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log('Canvas persisted to database:', response);
    } catch (error) {
      console.error('Error updating canvas:', error);
    }
  }, [canvasId, elements, isInitialLoad, updateSourceRef]);

  useEffect(() => {
    // Debounce API call for persistence
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateCanvas();
    }, 1000); // Longer debounce for API (1 second)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [elements, updateCanvas]);
};
