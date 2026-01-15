import React from 'react';

export const CanvasActionsContext = React.createContext({
  handleUndo: () => {},
  handleRedo: () => {},
  canUndo: false,
  canRedo: false,
  connectionState: 'disconnected',
  isInRoom: false,
  joinCanvasRoom: () => {},
  leaveCanvasRoom: () => {},
  setHandlers: () => {},
});

export default CanvasActionsContext;
