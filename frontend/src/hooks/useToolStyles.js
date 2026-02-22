import { useContext, useMemo } from 'react';
import ToolboxContext from '../store/Context/ToolBoxContext';

/**
 * Hook to get current tool styles from toolbox state
 * Eliminates repeated toolBoxState[activeTool.name].X access patterns
 * 
 * @param {Object} activeTool - The currently active tool object
 * @returns {Object} Tool styles (size, stroke, fill, etc.)
 */
export const useToolStyles = (activeTool) => {
  const { toolBoxState } = useContext(ToolboxContext);

  const styles = useMemo(() => {
    if (!activeTool?.name) {
      return {
        size: 1,
        stroke: '#000000',
        fillcolor: null,
        fillStyle: null,
        fontSize: 16,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      };
    }

    const toolState = toolBoxState[activeTool.name] || {};

    return {
      size: toolState.size ?? 1,
      stroke: toolState.stroke ?? '#000000',
      fillcolor: toolState.fillcolor ?? null,
      fillStyle: toolState.fillStyle ?? null,
      fontSize: toolState.fontSize ?? 16,
      thinning: toolState.thinning ?? 0.5,
      smoothing: toolState.smoothing ?? 0.5,
      streamline: toolState.streamline ?? 0.5,
    };
  }, [toolBoxState, activeTool?.name]);

  return styles;
};

export default useToolStyles;
