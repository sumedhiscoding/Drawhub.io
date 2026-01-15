import { useEffect, useRef } from 'react';
import axios from 'axios';
import { ALLOWED_METHODS } from '../utils/constants';
/**
 * Custom hook to fetch canvas data from the API
 * Returns isInitialLoad ref and canvas data
 */
export const useCanvasFetch = (canvasId, dispatchBoardAction,canvasDataRef) => {
  const isInitialLoad = useRef(true);
  

  useEffect(() => {
    const fetchCanvas = async () => {
      if (!canvasId) return;

      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/canvas/get/${canvasId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const canvas = response.data.canvas;
          canvasDataRef.current = canvas;

          dispatchBoardAction({
            type: ALLOWED_METHODS.SET_ELEMENTS,
            payload: canvas.elements,
          });
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching canvas:', error);
      }
    };

    fetchCanvas();
  }, [canvasId]);

  return { isInitialLoad, canvasData: canvasDataRef.current };
};
