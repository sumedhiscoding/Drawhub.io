import React from 'react';
import { TOOLS, ALLOWED_METHODS } from '../../utils/constants';
import { ACTIONS } from '../../utils/constants';
import { BoardContext } from '../../store/Context/BoardContext';
import { CanvasActionsContext } from '../../store/Context/CanvasActionContext';
import { SocketContext } from '../../store/Context/SocketContext';
import { getLocalUserId } from '../../utils/helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Trash2, Eraser } from 'lucide-react';

/**
 * Component for rendering toolbar action buttons (Undo, Redo) and tool selection buttons
 * Undo/Redo is powered by XState history machine
 */
const ToolButtons = () => {
  const { activeTool, setActiveTool, dispatchBoardAction } = React.useContext(BoardContext);
  const { handleUndo, handleRedo, canUndo, canRedo } = React.useContext(CanvasActionsContext);
  const { socket } = React.useContext(SocketContext);

  const handleClearBoard = () => {
    if (window.confirm('Are you sure you want to clear the entire board? This action cannot be undone.')) {
      // Clear locally first
      dispatchBoardAction({
        type: ALLOWED_METHODS.CLEAR_BOARD,
      });
      
      // Sync to other users if socket is connected
      if (socket?.connected) {
        try {
          socket.emit('clear-board', {
            userId: getLocalUserId(),
            timestamp: Date.now(),
          });
        } catch (error) {
          console.warn('Failed to sync clear board (non-blocking):', error);
        }
      }
    }
  };

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
        
        // Special handling for eraser - make it a dropdown
        if (tool.id === TOOLS.ERASER.id) {
          return (
            <DropdownMenu key={tool.id || idx}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`toolbar-button${
                    activeTool && activeTool.id === tool.id ? ' toolbar-button-active' : ''
                  }`}
                  title={tool.name}
                >
                  <Icon size={19} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setActiveTool(toolKey)}
                  className="cursor-pointer"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  <span>Stroke Eraser</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleClearBoard}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Clear Board</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        // Regular tools
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
