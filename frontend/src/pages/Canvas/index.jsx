import React from "react";
import BoardProvider from "../../store/board/BoardProvider";
import ToolBoxProvider from "../../store/board/ToolBoxProvider";
import Toolbar from "../../components/Toolbar";
import Board from "../../components/Board";

export default function Canvas() {
  return (
    <BoardProvider>
      <ToolBoxProvider>
        <Toolbar />
        <Board />
      </ToolBoxProvider>
    </BoardProvider>
  );
}
