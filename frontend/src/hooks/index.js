// Main board handlers (composed hook)
export { useBoardHandlers } from './useBoardHandlers';

// Composable hooks
export { useToolStyles } from './useToolStyles';
export { useDrawingRefs } from './useDrawingRefs';
export { useHistorySync } from './useHistorySync';
export { usePencilThrottle } from './usePencilThrottle';

// Element factories
export {
  stripForHistory,
  createPencilElement,
  createShapeElement,
  createTextElement,
  isShapeTool,
  createShapeMovePayload,
} from './elementFactories';

// Other hooks
export { default as useCanvasDraw } from './useCanvasDraw';
export { default as useCanvasFetch } from './useCanvasFetch';
export { default as useCanvasSetup } from './useCanvasSetup';
export { default as useCanvasUpdate } from './useCanvasUpdate';
export { default as useTextAreaFocus } from './useTextAreaFocus';
export { default as useToolBarHandlers } from './useToolBarHandlers';
export { default as useToolBoxHandler } from './useToolBoxHandler';
