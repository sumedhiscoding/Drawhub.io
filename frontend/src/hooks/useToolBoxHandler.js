import { useContext } from 'react';
import ToolBoxContext from '../store/Context/ToolBoxContext';
import { BoardContext } from '../store/Context/BoardContext';
import { TOOLS } from '../utils/constants';
import { TOOL_BOX_ACTIONS } from '../utils/constants';
const useToolBoxHandler = () => {
  const { dispatchToolBoxAction } = useContext(ToolBoxContext);
  const { activeTool } = useContext(BoardContext);

  const handlePencilPropChange = (prop, value) => {
    dispatchToolBoxAction({
      type: TOOL_BOX_ACTIONS.SET_PENCIL_PROP,
      tool: activeTool,
      prop,
      value,
    });
  };
  const handleStrokeColorChange = (color) => {
    dispatchToolBoxAction({
      type: TOOL_BOX_ACTIONS.SET_STROKE_COLOR,
      tool: activeTool,
      color,
    });
  };
  const handleFillColorChange = (color) => {
    dispatchToolBoxAction({
      type: TOOL_BOX_ACTIONS.SET_FILL_COLOR,
      tool: activeTool,
      color,
    });
  };
  const handleStrokeWidthChange = (width) => {
    if (activeTool.name === TOOLS.TEXT.name) {
      dispatchToolBoxAction({
        type: TOOL_BOX_ACTIONS.SET_FONT_SIZE,
        tool: activeTool,
        fontSize: parseInt(width),
      });
    } else {
      dispatchToolBoxAction({
        type: TOOL_BOX_ACTIONS.SET_STROKE_WIDTH,
        tool: activeTool,
        width: parseInt(width),
      });
    }
  };
  const handleFillStyleChange = (fillStyle) => {
    dispatchToolBoxAction({
      type: TOOL_BOX_ACTIONS.SET_FILL_STYLE,
      tool: activeTool,
      fillStyle,
    });
  };
  return {
    handlePencilPropChange,
    handleStrokeColorChange,
    handleFillColorChange,
    handleStrokeWidthChange,
    handleFillStyleChange,
  };
};

export default useToolBoxHandler;
