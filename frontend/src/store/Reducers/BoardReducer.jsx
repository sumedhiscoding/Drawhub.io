import {
  ALLOWED_METHODS,
  TOOLS,
  TOOL_ACTION_TYPE,
  generateElementId,
  getLocalUserId,
} from '../../utils/constants';
import { createTool, isPointNearElement } from '../../utils/helpers';

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
      const ownerId = action.payload?.ownerId || getLocalUserId();
      const elementId = action.payload?.id || generateElementId();

      switch (state.activeTool) {
        case TOOLS.PENCIL: {
          const { points, color, strokeWidth, thinning, smoothing, streamline } = action.payload;
          const activeToolId = activeTool?.id;
          const newElement = {
            id: elementId,
            ownerId: ownerId,
            type: activeToolId,
            points: points,
            color: color,
            strokeWidth: strokeWidth,
            roughElement: createTool(
              activeToolId,
              0,
              0,
              0,
              0,
              color,
              points,
              strokeWidth,
              null,
              null,
              thinning,
              smoothing,
              streamline,
            ),
          };
          return {
            ...state,
            ToolActionType: TOOL_ACTION_TYPE.DRAW,
            elements: [...elements, newElement],
          };
        }
        case TOOLS.LINE:
        case TOOLS.RECTANGLE:
        case TOOLS.CIRCLE:
        case TOOLS.DIAMOND:
        case TOOLS.ARROW: {
          const { x1, y1, color, strokeWidth, fill, fillStyle } = action.payload;
          const activeToolId = activeTool?.id;
          const newElement = {
            id: elementId,
            ownerId: ownerId,
            type: activeToolId,
            x1: x1,
            y1: y1,
            x2: x1,
            y2: y1,
            color: color,
            strokeWidth: strokeWidth,
            fill: fill,
            fillStyle: fillStyle,
            roughElement: createTool(
              activeToolId,
              x1,
              y1,
              x1,
              y1,
              color,
              strokeWidth,
              fill,
              fillStyle,
            ),
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
      const { x1, y1, text, fontSize, color, id: elemId, ownerId: elemOwnerId } = action.payload;
      const updatedElement = {
        id: elemId || generateElementId(),
        ownerId: elemOwnerId || getLocalUserId(),
        type: activeTool.id,
        left: x1,
        top: y1,
        text: text,
        fontSize: fontSize,
        color: color,
      };
      const updatedElements = [...elements, updatedElement];
      return {
        ...state,
        ToolActionType: TOOL_ACTION_TYPE.WRITE,
        elements: updatedElements,
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

    // Remote operations - applied from socket updates
    case ALLOWED_METHODS.REMOTE_UNDO: {
      const { elementId } = action.payload;
      if (!elementId) return state;

      const newElements = elements.filter((e) => e.id !== elementId);
      return {
        ...state,
        elements: newElements,
      };
    }

    case ALLOWED_METHODS.REMOTE_REDO: {
      const { element } = action.payload;
      if (!element || !element.id) return state;

      // Don't add if element already exists
      if (elements.some((e) => e.id === element.id)) return state;

      return {
        ...state,
        elements: [...elements, element],
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

    default:
      return state;
  }
};

export default BoardReducer;
