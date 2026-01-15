import React, { useState, useCallback } from 'react';
import { CanvasActionsContext } from '../Context/CanvasActionContext';

const CanvasActionsProvider = ({ children }) => {
  const [handlers, setHandlersState] = useState({
    handleUndo: () => {},
    handleRedo: () => {},
    canUndo: false,
    canRedo: false,
    connectionState: 'disconnected',
    isInRoom: false,
    joinCanvasRoom: () => {},
    leaveCanvasRoom: () => {},
  });

  const setHandlers = useCallback((newHandlers) => {
    setHandlersState((prev) => ({
      ...prev,
      ...newHandlers,
    }));
  }, []);

  const contextValue = {
    handleUndo: handlers.handleUndo,
    handleRedo: handlers.handleRedo,
    canUndo: handlers.canUndo,
    canRedo: handlers.canRedo,
    connectionState: handlers.connectionState,
    isInRoom: handlers.isInRoom,
    joinCanvasRoom: handlers.joinCanvasRoom,
    leaveCanvasRoom: handlers.leaveCanvasRoom,
    setHandlers,
  };

  return (
    <CanvasActionsContext.Provider value={contextValue}>{children}</CanvasActionsContext.Provider>
  );
};

export default CanvasActionsProvider;
