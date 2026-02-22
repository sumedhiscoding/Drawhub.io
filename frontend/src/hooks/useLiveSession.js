import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * Hook for managing live sessions
 * Handles starting/stopping live sessions and checking status
 * 
 * @returns {Object} Live session state and functions
 */
export const useLiveSession = () => {
  const { id: canvasId } = useParams();
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  /**
   * Check live session status
   */
  const checkStatus = useCallback(async () => {
    if (!canvasId) return;

    try {
      setIsCheckingStatus(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setIsCheckingStatus(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/canvas/live/status/${canvasId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIsLive(response.data.isLive || false);
    } catch (error) {
      // Don't show error for 404 or access denied - just set to false
      if (error.response?.status !== 404 && error.response?.status !== 403) {
        console.error('Error checking live session status:', error);
      }
      setIsLive(false);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [canvasId]);

  /**
   * Start a live session
   */
  const startLiveSession = useCallback(async () => {
    if (!canvasId) {
      toast.error('Canvas ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/canvas/live/start/${canvasId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIsLive(true);
      toast.success('Live session started! Others can now see your updates in real-time.');
      
      // Trigger room join by checking status again (useCanvasRoom will pick it up)
      // This ensures the owner also joins the room
      setTimeout(() => {
        checkStatus();
      }, 100);
      
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to start live session. Please try again.';
      toast.error(errorMessage);
      console.error('Error starting live session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [canvasId]);

  /**
   * Stop a live session
   */
  const stopLiveSession = useCallback(async () => {
    if (!canvasId) {
      toast.error('Canvas ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/canvas/live/stop/${canvasId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setIsLive(false);
      toast.success('Live session stopped.');
      
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to stop live session. Please try again.';
      toast.error(errorMessage);
      console.error('Error stopping live session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [canvasId]);

  /**
   * Toggle live session (start if stopped, stop if started)
   */
  const toggleLiveSession = useCallback(async () => {
    if (isLive) {
      await stopLiveSession();
    } else {
      await startLiveSession();
    }
  }, [isLive, startLiveSession, stopLiveSession]);

  // Check status on mount and when canvasId changes
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isLive,
    isLoading,
    isCheckingStatus,
    startLiveSession,
    stopLiveSession,
    toggleLiveSession,
    checkStatus,
  };
};
