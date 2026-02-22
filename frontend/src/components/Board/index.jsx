import React, { useRef, useEffect, useContext } from 'react';
import { BoardContext } from '../../store/Context/BoardContext';
import { CanvasActionsContext } from '../../store/Context/CanvasActionContext';
import { useParams } from 'react-router';
import { TOOL_ACTION_TYPE } from '../../utils/constants';
import toolboxContext from '../../store/Context/ToolBoxContext';
import { Textarea } from '@/components/ui/textarea';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useCanvasFetch } from '../../hooks/useCanvasFetch';
import { useCanvasUpdate } from '../../hooks/useCanvasUpdate';
import { useCanvasDraw } from '../../hooks/useCanvasDraw';
import { useTextAreaFocus } from '../../hooks/useTextAreaFocus';
import { useBoardHandlers } from '../../hooks/useBoardHandlers';

const Board = () => {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const canvasDataRef = useRef(null);
  const { id: canvasId } = useParams();

  // BoardContext.elements is the SINGLE SOURCE OF TRUTH
  const { activeTool, ToolActionType, elements, dispatchBoardAction } =
    useContext(BoardContext);

  const { toolBoxState } = useContext(toolboxContext);
  const { setHandlers } = useContext(CanvasActionsContext);

  // Setup canvas with window size
  useCanvasSetup(canvasRef);

  // Fetch canvas data and sync with BoardContext
  // Note: useCanvasFetch already dispatches SET_ELEMENTS when data is fetched
  const { isInitialLoad } = useCanvasFetch(canvasId, dispatchBoardAction, canvasDataRef);

  // Use BoardContext.elements for canvas updates and drawing (source of truth)
  useCanvasUpdate(canvasId, elements, isInitialLoad);

  // Draw elements from BoardContext (single source of truth)
  useCanvasDraw(canvasRef, elements);

  // Focus textarea when in WRITE mode
  useTextAreaFocus(textAreaRef, ToolActionType);

  // Board event handlers with XState history integration
  const {
    handleMouseDown,
    handleMouseMove,
    handleMoveUp,
    textAreaBlur,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  } = useBoardHandlers();

  // Register undo/redo handlers with CanvasActionsContext for toolbar access
  useEffect(() => {
    setHandlers({
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
    });
  }, [setHandlers, handleUndo, handleRedo, canUndo, canRedo]);

  return (
    <>
      {ToolActionType === TOOL_ACTION_TYPE.WRITE ? (
        <Textarea
          className="w-100"
          ref={textAreaRef}
          style={{
            position: 'absolute',
            left: elements[elements.length - 1]?.left || 0,
            top: elements[elements.length - 1]?.top || 0,
            fontSize: `${toolBoxState[activeTool.name]?.fontSize || 16}px`,
            color: toolBoxState[activeTool.name]?.stroke || '#000',
            zIndex: 10,
          }}
          type="text"
          placeholder=""
          onBlur={(e) => {
            const textValue = e.target.value;
            return textAreaBlur(textValue);
          }}
        ></Textarea>
      ) : (
        <></>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMoveUp}
      ></canvas>
    </>
  );
};

export default Board;
