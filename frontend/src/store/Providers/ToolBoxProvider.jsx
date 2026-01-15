import React, { useReducer } from 'react';
import ToolBoxContext from '../Context/ToolBoxContext';
import toolboxReducer from '../Reducers/ToolBoxReducer';
import { COLORS, FILL_STYLES, TOOLS } from '../../utils/constants';

const initialToolBoxState = {
  [TOOLS.PENCIL.name]: {
    stroke: COLORS.Black,
    size: 2,
    thinning: 0.5,
    streamline: 0.5,
    smoothing: 0.5,
    easing: 'EaseInOutCubic',
  },
  [TOOLS.CIRCLE.name]: {
    stroke: COLORS.Black,
    size: 1,
    fillcolor: null,
    fillStyle: FILL_STYLES.HACHURE,
  },
  [TOOLS.RECTANGLE.name]: {
    stroke: COLORS.Black,
    size: 1,
    fillcolor: null,
    fillStyle: FILL_STYLES.HACHURE,
  },
  [TOOLS.DIAMOND.name]: {
    stroke: COLORS.Black,
    size: 1,
    fillcolor: null,
    fillStyle: FILL_STYLES.HACHURE,
  },
  [TOOLS.ARROW.name]: {
    stroke: COLORS.Black,
    size: 1,
  },
  [TOOLS.LINE.name]: {
    stroke: COLORS.Black,
    size: 1,
  },
  [TOOLS.ERASER.name]: {
    size: 1,
  },
  [TOOLS.TEXT.name]: {
    stroke: COLORS.Black,
    fontSize: 16,
    fontFamily: 'Arial',
  },
};

const ToolBoxProvider = ({ children }) => {
  const [toolBoxState, dispatchToolBoxAction] = useReducer(toolboxReducer, initialToolBoxState);

  const ToolBoxContextValue = { toolBoxState, dispatchToolBoxAction };

  return <ToolBoxContext.Provider value={ToolBoxContextValue}>{children}</ToolBoxContext.Provider>;
};
export default ToolBoxProvider;
