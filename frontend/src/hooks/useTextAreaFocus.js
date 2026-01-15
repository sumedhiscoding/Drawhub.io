import { useEffect, useRef } from 'react';
import { TOOL_ACTION_TYPE } from '../utils/constants';

/**
 * Custom hook to handle textarea focus when in WRITE mode
 */
export const useTextAreaFocus = (textAreaRef, ToolActionType) => {
  useEffect(() => {
    if (ToolActionType === TOOL_ACTION_TYPE.WRITE && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current.focus();
      }, 0);
    }
  }, [ToolActionType, textAreaRef]);
};
