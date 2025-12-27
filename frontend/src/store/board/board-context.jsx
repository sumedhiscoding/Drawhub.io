import { createContext } from "react";
import { ALLOWED_METHODS } from "../../utils/constants";

const BoardContext = createContext({
  elements: [],
  history:[[]],
  index:0,
  activeTool: "",
  color: "black",
  strokeWidth: 1,
  dispatchBoardAction: () => {},
  ALLOWED_METHODS: ALLOWED_METHODS,
  ToolActionType: "",
  setActiveTool: (tool) => {},
  boardUndoHandler: () => {},
  boardRedoHandler: () => {},
});

export { BoardContext };
