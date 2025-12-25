import React, { useEffect } from "react";
import { TOOLS } from "../../utils/constants";
import { BoardContext } from "../../store/board/board-context";

const Toolbar = () => {
  const { activeTool, setActiveTool } = React.useContext(BoardContext);

  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        {Object.keys(TOOLS).map((toolKey, idx) => {
          const tool = TOOLS[toolKey];
          const Icon = tool.icon;
          return (
            <button
              key={tool.id || idx}
              className={`toolbar-button${
                activeTool === toolKey ? " toolbar-button-active" : ""
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
