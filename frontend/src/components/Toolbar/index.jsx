import React, { useEffect } from "react";
import { TOOLS } from "../../utils/constants";
import { BoardContext } from "../../store/board/board-context";
import { ACTIONS } from "../../utils/constants";
const Toolbar = () => {
  const { activeTool, setActiveTool, boardRedoHandler, boardUndoHandler } = React.useContext(BoardContext);
  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <button
          key={ACTIONS.UNDO.id}
          className="toolbar-button"
          onClick={boardUndoHandler}
          title={ACTIONS.UNDO.name}
        >
          <ACTIONS.UNDO.icon size={22} />
        </button>
        <button
          key={ACTIONS.REDO.id}
          className="toolbar-button"
          onClick={boardRedoHandler}
          title={ACTIONS.REDO.name}
        >
          <ACTIONS.REDO.icon size={22} />
        </button>
        {Object.keys(TOOLS).map((toolKey, idx) => {
          const tool = TOOLS[toolKey];
          const Icon = tool.icon;
          return (
            <button
              key={tool.id || idx}
              className={`toolbar-button${
                activeTool && activeTool.id === tool.id ? " toolbar-button-active" : ""
              }`}
              onClick={() => setActiveTool(toolKey)}
              title={tool.name}
            >
              <Icon size={22} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Toolbar;
