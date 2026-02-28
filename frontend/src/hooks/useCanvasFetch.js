import { useEffect, useRef } from 'react';
import axios from 'axios';
import { ALLOWED_METHODS } from '../utils/constants';
import { createTool } from '../utils/helpers';
import apiConfig from '@/config/api';
/**
 * Custom hook to fetch canvas data from the API
 * Returns isInitialLoad ref and canvas data
 */
export const useCanvasFetch = (canvasId, dispatchBoardAction, canvasDataRef) => {
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchCanvas = async () => {
      if (!canvasId) return;

      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(`${apiConfig.apiUrl}/canvas/get/${canvasId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const canvas = response.data.canvas;

          // Hydrate elements by regenerating roughElement from stored points/coordinates
          const hydratedElements = (canvas.elements || []).map((element) => ({
            ...element,
            roughElement: createTool(
              element.type,
              element.x1 ?? 0,
              element.y1 ?? 0,
              element.x2 ?? 0,
              element.y2 ?? 0,
              element.color,
              element.points || [],
              element.strokeWidth,
              element.fill,
              element.fillStyle,
              element.thinning,
              element.smoothing,
              element.streamline,
            ),
          }));

          canvasDataRef.current = { ...canvas, elements: hydratedElements };

          dispatchBoardAction({
            type: ALLOWED_METHODS.SET_ELEMENTS,
            payload: hydratedElements,
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
  }, [canvasId, canvasDataRef, dispatchBoardAction]);

  return { isInitialLoad, canvasData: canvasDataRef.current };
};
