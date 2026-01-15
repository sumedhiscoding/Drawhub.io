import React from 'react';
import { TOOLS } from '../../utils/constants';
import { ACTIONS } from '../../utils/constants';
import { BoardContext } from '../../store/Context/BoardContext';
import { CanvasActionsContext } from '../../store/Context/CanvasActionContext';

/**
 * Component for rendering toolbar action buttons (Undo, Redo) and tool selection buttons
 * Uses socket-aware undo/redo handlers from CanvasActionsContext for collaborative editing
 * Undo/Redo is powered by XState history machine
 */
const ToolButtons = () => {
  const { activeTool, setActiveTool } = React.useContext(BoardContext);
  const { handleUndo, handleRedo, canUndo, canRedo } = React.useContext(CanvasActionsContext);

  return (
    <>
      <button
        key={ACTIONS.UNDO.id}
        className={`toolbar-button${!canUndo ? ' toolbar-button-disabled' : ''}`}
        onClick={handleUndo}
        disabled={!canUndo}
        title={ACTIONS.UNDO.name}
      >
        <ACTIONS.UNDO.icon size={22} />
      </button>
      <button
        key={ACTIONS.REDO.id}
        className={`toolbar-button${!canRedo ? ' toolbar-button-disabled' : ''}`}
        onClick={handleRedo}
        disabled={!canRedo}
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
              activeTool && activeTool.id === tool.id ? ' toolbar-button-active' : ''
            }`}
            onClick={() => setActiveTool(toolKey)}
            title={tool.name}
          >
            <Icon size={19} />
          </button>
        );
      })}
    </>
  );
};

export default ToolButtons;
