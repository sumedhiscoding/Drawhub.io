import React from 'react';
import BoardProvider from '../../store/Providers/BoardProvider';
import ToolBoxProvider from '../../store/Providers/ToolBoxProvider';
import CanvasActionsProvider from '../../store/Providers/CanvasActionProvider';
import { HistoryProvider } from '../../store/history';
import Toolbar from '../../components/Toolbar';
import Board from '../../components/Board';
import SocketProvider from '../../store/Providers/SocketProvider'; // Add this

export default function Canvas() {
  return (
    <HistoryProvider>
      <BoardProvider>
        <ToolBoxProvider>
          <CanvasActionsProvider>
            <SocketProvider>
              <Toolbar />
              <Board />
            </SocketProvider>
          </CanvasActionsProvider>
        </ToolBoxProvider>
      </BoardProvider>
    </HistoryProvider>
  );
}
