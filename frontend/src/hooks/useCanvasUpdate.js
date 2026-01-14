import { useEffect, useRef, useCallback } from "react";
import axios from "axios";

/**
 * Custom hook to update canvas data with debouncing
 */
export const useCanvasUpdate = (canvasId, elements, isInitialLoad) => {
  const timeoutRef = useRef(null);

  const updateCanvas = useCallback(async () => {
    if (!canvasId || isInitialLoad.current) {
      return;
    }

    const payload = {
      elements: elements,
    };
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/canvas/update/${canvasId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Canvas updated:", response);
    } catch (error) {
      console.error("Error updating canvas:", error);
    }
  }, [canvasId, elements, isInitialLoad]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateCanvas();
    }, 400);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [updateCanvas]);
};
