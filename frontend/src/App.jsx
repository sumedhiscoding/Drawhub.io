import React, { useEffect, useRef } from "react";
import rough from "roughjs";
import Board from "./components/Board";
import BoardProvider from "./store/board/BoardProvider.jsx";
import ToolBoxProvider from "./store/board/ToolBoxProvider.jsx";
import Toolbox from "./components/Toolbox/index.jsx";
import Toolbar from "./components/Toolbar";
const App = () => {
  return (
    <>
      <BoardProvider>
        <ToolBoxProvider> 
        <Toolbar />
        <Board />
        <Toolbox />
      </ToolBoxProvider>
      </BoardProvider>
    </>
  );
};

export default App;
