import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import apiConfig from '@/config/api';

/**
 * Custom hook to update canvas data with debouncing
 * Handles HTTP API persistence
 *
 * @param {string} canvasId - Canvas ID
 * @param {Array} elements - Canvas elements
 * @param {Object} isInitialLoad - Ref to track initial load
 */
export const useCanvasUpdate = (canvasId, elements, isInitialLoad) => {
  const timeoutRef = useRef(null);
  // Save to database via HTTP API (debounced)
  const updateCanvas = useCallback(async () => {
    if (!canvasId || isInitialLoad.current) {
      return;
    }

    const elementsForStorage = elements.map(({ roughElement, ...rest }) => rest);

    const payload = { elements: elementsForStorage };
    const token = localStorage.getItem('token');

    try {
      await axios.put(
        `${apiConfig.apiUrl}/canvas/update/${canvasId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      // Silently fail
    }
  }, [canvasId, elements, isInitialLoad]);

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
