import { createContext } from 'react';
import { ALLOWED_METHODS } from '../../utils/constants';

// Note: Undo/redo is now handled by HistoryContext via XState
const BoardContext = createContext({
  elements: [],
  activeTool: '',
  color: 'black',
  strokeWidth: 1,
  ToolActionType: '',
  setActiveTool: () => {},
  dispatchBoardAction: () => {},
  ALLOWED_METHODS: ALLOWED_METHODS,
});

export { BoardContext };
