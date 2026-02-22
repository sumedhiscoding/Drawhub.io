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
        isConnected: true,
      };
    case 'DISCONNECT':
      return {
        ...state,
        socket: null,
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
    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const socket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      dispatch({ type: 'CONNECT', payload: socket });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      dispatch({ type: 'DISCONNECT' });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      dispatch({ type: 'DISCONNECT' });
    };
  }, []);

  const socketContextValue = {
    socket: socketState.socket,
    isConnected: socketState.isConnected,
  };

  return (
    <SocketContext.Provider value={socketContextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;