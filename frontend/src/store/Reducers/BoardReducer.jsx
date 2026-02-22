import { ALLOWED_METHODS, TOOLS, TOOL_ACTION_TYPE, REALTIME_CHANGE_TYPES } from '../../utils/constants';
import {
  createTool,
  isPointNearElement,
  generateElementId,
  getLocalUserId,
} from '../../utils/helpers';

export const getToolParams = (element) => {
  return [
    element.type,
    element.x1 ?? 0,
    element.y1 ?? 0,
    element.x2 ?? 0,
    element.y2 ?? 0,
    element.color,
    element.points || [],
    element.strokeWidth,
    element.fill,
    element.fillStyle,
    element.thinning ?? 0.5,
    element.smoothing ?? 0.5,
    element.streamline ?? 0.5,
  ];
};

/**
 * Board Reducer - SINGLE SOURCE OF TRUTH for elements
 *
 * Undo/Redo patches are applied here via APPLY_PATCH action.
 * The XState history machine only tracks the diffs (before/after patches).
 */
const BoardReducer = (state, action) => {
  const { elements, activeTool } = state;

  switch (action.type) {
    case ALLOWED_METHODS.DRAW_DOWN: {
      switch (state.activeTool) {
        case TOOLS.PENCIL:
        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.CIRCLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW: {
          // Use the pre-built element from payload (already has roughElement)
          // This avoids duplicate createTool calls and precision issues
          const newElement = {
            ...action.payload,
            id: action.payload?.id || generateElementId(),
            ownerId: action.payload?.ownerId || getLocalUserId(),
          };
          return {
            ...state,
            ToolActionType: TOOL_ACTION_TYPE.DRAW,
            elements: [...elements, newElement],
          };
        }
        case TOOLS.ERASER: {
          return { ...state, ToolActionType: TOOL_ACTION_TYPE.ERASE };
        }
        default:
          return state;
      }
    }

    case ALLOWED_METHODS.DRAW_MOVE: {
      switch (state.activeTool) {
        case TOOLS.PENCIL: {
          const { points, color, strokeWidth, thinning, smoothing, streamline } = action.payload;
          const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
          const activeToolId = activeTool?.id;
          const newPoints = [...elements[index].points, ...points];

          const updatedElement = {
            ...elements[index],
            points: newPoints,
            roughElement: createTool(
              activeToolId,
              elements[index]?.x1,
              elements[index]?.y1,
              elements[index]?.x2,
              elements[index]?.y2,
              color,
              newPoints,
              strokeWidth,
              elements[index]?.fill,
              elements[index]?.fillStyle,
              thinning,
              smoothing,
              streamline,
            ),
          };
          const updatedElements = [...elements];
          updatedElements[index] = updatedElement;
          return { ...state, elements: updatedElements };
        }
        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.CIRCLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW: {
          const { x2, y2 } = action.payload;
          const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
          const activeToolId = activeTool?.id;
          const updatedElement = {
            ...elements[index],
            x2: x2,
            y2: y2,
            roughElement: createTool(
              activeToolId,
              elements[index]?.x1,
              elements[index]?.y1,
              x2,
              y2,
              elements[index]?.color,
              [],
              elements[index]?.strokeWidth,
              elements[index]?.fill,
              elements[index]?.fillStyle,
            ),
          };
          const updatedElements = [...elements];
          updatedElements[index] = updatedElement;
          return { ...state, elements: updatedElements };
        }
        default:
          return state;
      }
    }

    case ALLOWED_METHODS.DRAW_UP: {
      return {
        ...state,
        ToolActionType: TOOL_ACTION_TYPE.NONE,
      };
    }

    case ALLOWED_METHODS.SET_ACTIVE_TOOL: {
      return { ...state, activeTool: TOOLS[action.payload.name] };
    }

    case ALLOWED_METHODS.SET_COLOR: {
      return { ...state, color: action.payload };
    }

    case ALLOWED_METHODS.CLEAR_BOARD: {
      return { ...state, elements: [] };
    }

    case ALLOWED_METHODS.ERASE_ELEMENT: {
      const { x1, y1 } = action.payload;
      const filteredElements = elements.filter((element) => !isPointNearElement(x1, y1, element));
      return {
        ...state,
        elements: filteredElements,
      };
    }

    case ALLOWED_METHODS.ADD_TEXT: {
      // Use the pre-built element from payload (from createTextElement)
      const newElement = {
        ...action.payload,
        id: action.payload?.id || generateElementId(),
        ownerId: action.payload?.ownerId || getLocalUserId(),
      };
      return {
        ...state,
        ToolActionType: TOOL_ACTION_TYPE.WRITE,
        elements: [...elements, newElement],
      };
    }

    case ALLOWED_METHODS.SAVE_TEXT: {
      const { text } = action.payload;
      const index = elements.length - 1 > 0 ? elements.length - 1 : 0;
      const updatedElement = {
        ...elements[index],
        text: text,
      };
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      return {
        ...state,
        ToolActionType: TOOL_ACTION_TYPE.NONE,
        elements: updatedElements,
      };
    }

    case ALLOWED_METHODS.SET_ELEMENTS: {
      return {
        ...state,
        elements: action.payload,
      };
    }

    /**
     * Apply a patch from undo/redo
     * Patch shape:
     *   - { element: fullElement } → add/restore element
     *   - { elementId: string } → remove element by id
     *   - { elementId: string, updates: object } → update element properties
     */
    case ALLOWED_METHODS.APPLY_PATCH: {
      const { patch, elementId } = action.payload;

      if (!patch) {
        // null patch = element is being removed (undo of add)
        if (elementId) {
          return {
            ...state,
            elements: elements.filter((e) => e.id !== elementId),
          };
        }
        return state;
      }

      // If patch has full element, add/restore it
      if (patch.element) {
        const restoredElement = {
          ...patch.element,
          roughElement: createTool(
            patch.element.type,
            patch.element.x1 ?? 0,
            patch.element.y1 ?? 0,
            patch.element.x2 ?? 0,
            patch.element.y2 ?? 0,
            patch.element.color,
            patch.element.points || [],
            patch.element.strokeWidth,
            patch.element.fill,
            patch.element.fillStyle,
            patch.element.thinning,
            patch.element.smoothing,
            patch.element.streamline,
          ),
        };
        // Check if element already exists
        const existingIndex = elements.findIndex((e) => e.id === patch.element.id);
        if (existingIndex >= 0) {
          // Replace existing
          const newElements = [...elements];
          newElements[existingIndex] = restoredElement;
          return { ...state, elements: newElements };
        }
        // Add new
        return {
          ...state,
          elements: [...elements, restoredElement],
        };
      }

      // If patch has updates, apply them to the element
      if (patch.updates && elementId) {
        return {
          ...state,
          elements: elements.map((e) => (e.id === elementId ? { ...e, ...patch.updates } : e)),
        };
      }

      return state;
    }

    case REALTIME_CHANGE_TYPES.ADD: {
      const newElement = {
        ...action.payload.element,
        id: action.payload.elementId || generateElementId(),
        ownerId: action.payload.element?.ownerId || getLocalUserId(),
        roughElement: createTool(...getToolParams(action.payload.element)),
      };
      return { ...state, elements: [...elements, newElement] };
    }
    case REALTIME_CHANGE_TYPES.UPDATE: {
      const existingElement = elements.find((e) => e.id === action.payload.elementId);
      
      // Add safety check
      if (!existingElement) {
        console.warn(`Element ${action.payload.elementId} not found for UPDATE`);
        return state;
      }
      
      const updatedElement = {
        ...existingElement,
        ...action.payload.updates,
        roughElement: createTool(...getToolParams({ ...existingElement, ...action.payload.updates })),
      };
      const updatedElements = [...elements.filter((e) => e.id !== action.payload.elementId), updatedElement];
      return { ...state, elements: updatedElements };
    }
    case REALTIME_CHANGE_TYPES.DELETE: {
      const updatedElements = [...elements.filter((e) => e.id !== action.payload.elementId)];
      return { ...state, elements: updatedElements };
    }
    default:
      return state;
  }
};

export default BoardReducer;
