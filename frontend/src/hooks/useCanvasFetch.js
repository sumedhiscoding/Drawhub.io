import { useEffect, useRef } from "react";
import axios from "axios";

/**
 * Custom hook to fetch canvas data from the API
 * Returns isInitialLoad ref that can be used to prevent updates during initial load
 */
export const useCanvasFetch = (canvasId, dispatchBoardAction, ALLOWED_METHODS) => {
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchCanvas = async () => {
      if (!canvasId) return;

      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/canvas/get/${canvasId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          dispatchBoardAction({
            type: ALLOWED_METHODS.SET_ELEMENTS,
            payload: response.data.canvas.elements,
          });
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      } catch (error) {
        console.error("Error fetching canvas:", error);
      }
    };

    fetchCanvas();
  }, [canvasId, dispatchBoardAction, ALLOWED_METHODS]);

  return isInitialLoad;
};
