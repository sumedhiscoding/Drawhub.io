import React from 'react';

export const CanvasActionsContext = React.createContext({
  handleUndo: () => {},
  handleRedo: () => {},
  canUndo: false,
  canRedo: false,
  setHandlers: () => {},
});

export default CanvasActionsContext;
