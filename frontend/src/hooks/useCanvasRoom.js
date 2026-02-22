import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { useContext } from 'react';
import { SocketContext } from '../store/Context/SocketContext';
import axios from 'axios';

/**
 * Hook to manage canvas room joining/leaving for live sessions
 * Automatically joins room when canvas loads and has active live session, leaves on unmount
 */
export const useCanvasRoom = () => {
  const { id: canvasId } = useParams();
  const { socket } = useContext(SocketContext);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!socket || !canvasId) return;

    let cleanupListeners = null;
    let isCheckingRef = false; // Prevent multiple simultaneous checks

    // Check if canvas has active live session before joining
    const checkAndJoinRoom = async () => {
      // Prevent duplicate checks
      if (isCheckingRef) return;
      isCheckingRef = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check live session status
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/canvas/live/status/${canvasId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Only join if there's an active live session
        if (response.data.isLive) {
          if (!socket.connected) {
            hasJoinedRef.current = false;
            return;
          }

          // Set auth for socket (if not already set)
          if (token && !socket.auth?.token) {
            socket.auth = { token };
          }

          // Join canvas room for live session
          socket.emit('join-canvas', canvasId);
          hasJoinedRef.current = true;

          // Optional: Listen for join confirmation
          const handleJoined = () => {
            // Joined successfully
          };

          const handleError = () => {
            hasJoinedRef.current = false;
          };

          socket.on('joined-canvas', handleJoined);
          socket.on('error', handleError);

          // Store cleanup function
          cleanupListeners = () => {
            socket.off('joined-canvas', handleJoined);
            socket.off('error', handleError);
          };
        } else {
          // No active live session, don't join
          hasJoinedRef.current = false;
        }
      } catch (error) {
        // Silently fail - don't block if check fails
        hasJoinedRef.current = false;
      } finally {
        isCheckingRef = false;
      }
    };

    // If socket is already connected, check and join immediately
    if (socket.connected) {
      checkAndJoinRoom();
    } else {
      // Wait for connection
      const handleConnect = () => {
        checkAndJoinRoom();
      };

      socket.on('connect', handleConnect);

      cleanupListeners = () => {
        socket.off('connect', handleConnect);
      };
    }

    // Periodically check if we need to join (in case live session starts while we're on the page)
    // This ensures the owner joins when they start the live session
    const intervalId = setInterval(() => {
      // Only check if socket is connected and we haven't joined yet
      if (socket.connected && !hasJoinedRef.current) {
        checkAndJoinRoom();
      }
    }, 2000); // Check every 2 seconds

    // Leave room on unmount
    return () => {
      clearInterval(intervalId);
      if (cleanupListeners) {
        cleanupListeners();
      }
      if (hasJoinedRef.current && socket.connected) {
        socket.emit('leave-canvas', canvasId);
        hasJoinedRef.current = false;
      }
    };
  }, [socket, canvasId]);
};
