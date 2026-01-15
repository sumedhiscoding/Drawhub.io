import React from 'react';
import BoardProvider from '../../store/Providers/BoardProvider';
import ToolBoxProvider from '../../store/Providers/ToolBoxProvider';
import CanvasActionsProvider from '../../store/Providers/CanvasActionProvider';
import { HistoryProvider } from '../../store/History';
import Toolbar from '../../components/Toolbar';
import Board from '../../components/Board';

export default function Canvas() {
  return (
    <HistoryProvider>
      <BoardProvider>
        <ToolBoxProvider>
          <CanvasActionsProvider>
            <Toolbar />
            <Board />
          </CanvasActionsProvider>
        </ToolBoxProvider>
      </BoardProvider>
    </HistoryProvider>
  );
}
