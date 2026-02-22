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
      // Check if element already exists (might have been created from UPDATE)
      const existingElement = elements.find((e) => e.id === action.payload.elementId);
      
      if (existingElement) {
        // Element already exists (created from UPDATE), merge with ADD data
        // ADD has the complete element, so use it but preserve any updates that might have arrived
        console.log('⚠️ ADD received for existing element, merging...', {
          elementId: action.payload.elementId,
        });
        
        const mergedElement = {
          ...action.payload.element,
          id: action.payload.elementId,
          ownerId: action.payload.element?.ownerId || existingElement.ownerId,
          // Preserve points from existing if they're more recent (longer array)
          points: existingElement.points?.length > (action.payload.element?.points?.length || 0) 
            ? existingElement.points 
            : (action.payload.element?.points || existingElement.points),
          roughElement: createTool(...getToolParams({
            ...action.payload.element,
            // Use existing points if they're more complete
            points: existingElement.points?.length > (action.payload.element?.points?.length || 0) 
              ? existingElement.points 
              : (action.payload.element?.points || []),
          })),
        };
        
        const updatedElements = [...elements.filter((e) => e.id !== action.payload.elementId), mergedElement];
        return { ...state, elements: updatedElements };
      }
      
      // Element doesn't exist, create it
      const newElement = {
        ...action.payload.element,
        id: action.payload.elementId || generateElementId(),
        ownerId: action.payload.element?.ownerId || getLocalUserId(),
        roughElement: createTool(...getToolParams(action.payload.element)),
      };
      
      console.log('✅ Reducer: Adding new element', {
        elementId: newElement.id,
        type: newElement.type,
      });
      
      return { ...state, elements: [...elements, newElement] };
    }
    case REALTIME_CHANGE_TYPES.UPDATE: {
      const existingElement = elements.find((e) => e.id === action.payload.elementId);
      const updates = action.payload.updates || {};
      
      // If element doesn't exist, create it from the updates (handles UPDATE arriving before ADD)
      if (!existingElement) {
        console.log('⚠️ Element not found for UPDATE, creating from updates', {
          elementId: action.payload.elementId,
          hasPoints: !!updates.points,
          hasX2Y2: !!(updates.x2 !== undefined && updates.y2 !== undefined),
        });

        // Determine element type from updates
        // If updates has points, it's a pencil element
        if (updates.points && Array.isArray(updates.points) && updates.points.length > 0) {
          // It's a pencil - create element from updates
          // Derive x1, y1 from first point if not provided
          const firstPoint = updates.points[0];
          const x1 = updates.x1 !== undefined ? updates.x1 : (Array.isArray(firstPoint) ? firstPoint[0] : 0);
          const y1 = updates.y1 !== undefined ? updates.y1 : (Array.isArray(firstPoint) ? firstPoint[1] : 0);
          
          const newElement = {
            id: action.payload.elementId,
            ownerId: getLocalUserId(), // Will be overridden by actual owner when ADD arrives
            type: TOOLS.PENCIL.id,
            points: updates.points,
            strokeWidth: updates.strokeWidth || 2,
            color: updates.color || '#000',
            thinning: updates.thinning ?? 0.5,
            smoothing: updates.smoothing ?? 0.5,
            streamline: updates.streamline ?? 0.5,
            x1: x1,
            y1: y1,
            x2: updates.x2 !== undefined ? updates.x2 : x1,
            y2: updates.y2 !== undefined ? updates.y2 : y1,
            roughElement: createTool(
              TOOLS.PENCIL.id,
              x1,
              y1,
              updates.x2 !== undefined ? updates.x2 : x1,
              updates.y2 !== undefined ? updates.y2 : y1,
              updates.color || '#000',
              updates.points,
              updates.strokeWidth || 2,
              null,
              null,
              updates.thinning ?? 0.5,
              updates.smoothing ?? 0.5,
              updates.streamline ?? 0.5,
            ),
          };
          
          // Element created successfully - no need to log every time
          
          return { ...state, elements: [...elements, newElement] };
        } else if (updates.text !== undefined) {
          // It's a text element - create from updates
          // Text updates should include position and style info
          const newElement = {
            id: action.payload.elementId,
            ownerId: getLocalUserId(), // Will be overridden by actual owner when ADD arrives
            type: TOOLS.TEXT.id,
            text: updates.text || '',
            left: updates.left || 0,
            top: updates.top || 0,
            x1: updates.x1 || updates.left || 0,
            y1: updates.y1 || updates.top || 0,
            fontSize: updates.fontSize || 16,
            color: updates.color || '#000',
          };
          
          return { ...state, elements: [...elements, newElement] };
        } else if (updates.x2 !== undefined && updates.y2 !== undefined) {
          // It's likely a shape, but we don't have enough info to create it properly
          // Just log and skip - wait for ADD
          console.warn('⚠️ UPDATE for shape element received before ADD - cannot create without type. Waiting for ADD...', {
            elementId: action.payload.elementId,
          });
          return state;
        } else {
          // Unknown type, skip
          console.warn('⚠️ UPDATE received but cannot determine element type from updates', {
            elementId: action.payload.elementId,
            updates: Object.keys(updates),
          });
          return state;
        }
      }
      
      // Element exists - apply updates
      // Merge updates - for pencil, points should be replaced (not appended) when coming from remote
      const updatedElement = {
        ...existingElement,
        // For pencil points from remote, replace the entire points array
        // (remote already has the complete updated points array)
        ...(updates.points ? { points: updates.points } : {}),
        // Merge other updates
        ...Object.fromEntries(
          Object.entries(updates).filter(([key]) => key !== 'points')
        ),
        // Rebuild roughElement with updated data
        roughElement: createTool(...getToolParams({ 
          ...existingElement, 
          ...updates,
          // Ensure points are used from updates if provided
          points: updates.points || existingElement.points,
        })),
      };
      
      // Reduced logging for performance
      // Only log occasionally to avoid console spam
      
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
