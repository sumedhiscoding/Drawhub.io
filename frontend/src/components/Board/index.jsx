import React, { useRef, useEffect } from 'react';
import { BoardContext } from '../../store/Context/BoardContext';
import { CanvasActionsContext } from '../../store/Context/CanvasActionContext';
import { useParams } from 'react-router';
import { SOURCE_TYPES, TOOL_ACTION_TYPE } from '../../utils/constants';
import { ALLOWED_METHODS } from '../../utils/constants';
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
  const updateSourceRef = useRef(SOURCE_TYPES.LOCAL);
  const canvasDataRef = useRef(null);
  const { id: canvasId } = useParams();

  // BoardContext.elements is the SINGLE SOURCE OF TRUTH
  const { activeTool, ToolActionType, elements, dispatchBoardAction } =
    React.useContext(BoardContext);

  const { toolBoxState } = React.useContext(toolboxContext);
  const { setHandlers } = React.useContext(CanvasActionsContext);

  // Setup canvas with window size
  useCanvasSetup(canvasRef);

  // Fetch canvas data and sync with BoardContext
  const { isInitialLoad, canvasData } = useCanvasFetch(
    canvasId,
    dispatchBoardAction,
    canvasDataRef
  );

  // Sync fetched elements with BoardContext
  useEffect(() => {
    if (canvasDataRef.current?.elements) {
      dispatchBoardAction({
        type: ALLOWED_METHODS.SET_ELEMENTS,
        payload: canvasDataRef.current.elements,
      });
    } 
  }, [canvasDataRef, dispatchBoardAction]);

  // Use BoardContext.elements for canvas updates and drawing (source of truth)
  useCanvasUpdate(canvasId, elements, isInitialLoad, updateSourceRef);

  // Draw elements from BoardContext (single source of truth)
  useCanvasDraw(canvasRef, elements , updateSourceRef);

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
    connectionState,
    isInRoom,
    joinCanvasRoom,
    leaveCanvasRoom,
  } = useBoardHandlers({
    canvasId: canvasId,
    updateSourceRef,
  });

  // Share socket-aware undo/redo handlers with Toolbar via context
  useEffect(() => {
    setHandlers({
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
      connectionState,
      isInRoom,
      joinCanvasRoom,
      leaveCanvasRoom,
    });
  }, [
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    connectionState,
    isInRoom,
    joinCanvasRoom,
    leaveCanvasRoom,
    setHandlers,
  ]);

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
