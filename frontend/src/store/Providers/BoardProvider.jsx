import React from 'react';
import { BoardContext } from '../Context/BoardContext';
import { ALLOWED_METHODS, TOOL_ACTION_TYPE, TOOLS } from '../../utils/constants';
import BoardReducer from '../Reducers/BoardReducer';

const BoardProvider = ({ children }) => {
  // Note: Undo/redo is now handled by the HistoryProvider via XState
  // This reducer only handles drawing state and tool selection
  const initialBoardState = {
    elements: [],
    activeTool: TOOLS.LINE,
    color: 'black',
    strokeWidth: 1,
    ToolActionType: TOOL_ACTION_TYPE.NONE,
  };

  const [BoardState, dispatchBoardAction] = React.useReducer(BoardReducer, initialBoardState);

  const setActiveTool = (tool) =>
    dispatchBoardAction({
      type: ALLOWED_METHODS.SET_ACTIVE_TOOL,
      payload: {
        name: tool,
      },
    });

  const boardContextValue = {
    color: BoardState.color,
    elements: BoardState.elements,
    activeTool: BoardState.activeTool,
    strokeWidth: BoardState.strokeWidth,
    ToolActionType: BoardState.ToolActionType,
    setActiveTool,
    dispatchBoardAction,
    ALLOWED_METHODS,
  };

  return <BoardContext.Provider value={boardContextValue}>{children}</BoardContext.Provider>;
};

export default BoardProvider;
