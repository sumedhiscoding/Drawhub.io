import React, { useEffect, useReducer } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from '../Context/SocketContext';

// Socket reducer
const socketReducer = (state, action) => {
  switch (action.type) {
    case 'CONNECT':
      return {
        ...state,
        socket: action.payload,
        // Check if socket is actually connected
        isConnected: action.payload?.connected || false,
      };
    case 'DISCONNECT':
      return {
        ...state,
        // Keep socket object but mark as disconnected
        // This allows app to work without active connection
        socket: state.socket, // Keep socket object
        isConnected: false,
      };
    default:
      return state;
  }
};

export const SocketProvider = ({ children }) => {
  const [socketState, dispatch] = useReducer(socketReducer, {
    socket: null,
    isConnected: false,
  });

  useEffect(() => {
    // Initialize socket connection with non-blocking configuration
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Add polling as fallback
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 5000, // Connection timeout - don't wait forever
      // Don't block on connection - allow app to work without socket
      forceNew: false,
      // Add auth token for authentication
      auth: token ? { token } : {},
    });

    // Set socket immediately (don't wait for connection)
    // This ensures the app works even if socket never connects
    dispatch({ type: 'CONNECT', payload: socket });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Update state to reflect connection
      dispatch({ type: 'CONNECT', payload: socket });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      // Keep socket object but mark as disconnected
      // App continues to work without socket
      dispatch({ type: 'DISCONNECT' });
    });

    socket.on('connect_error', (error) => {
      // Don't block - just log and continue
      // Socket will keep trying to reconnect in background
      console.warn('Socket connection error (non-blocking):', error.message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      dispatch({ type: 'DISCONNECT' });
    };
  }, []);

  const socketContextValue = {
    socket: socketState.socket, // Always provide socket object (even if not connected)
    isConnected: socketState.isConnected,
  };

  return (
    <SocketContext.Provider value={socketContextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;