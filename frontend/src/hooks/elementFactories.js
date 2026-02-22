import { createTool, generateElementId, getLocalUserId } from '../utils/helpers';
import { TOOLS } from '../utils/constants';

/**
 * Strip roughElement from element for history storage
 * @param {Object} element - Element to strip
 * @returns {Object|null} Element without roughElement
 */
export const stripForHistory = (element) => {
  if (!element) return null;
  const { roughElement, ...minimal } = element;
  return minimal;
};

/**
 * Create a new pencil element
 * @param {Object} event - Mouse event
 * @param {Object} styles - Tool styles from useToolStyles
 * @returns {Object} New pencil element
 */
export const createPencilElement = (event, styles) => {
  const elementId = generateElementId();
  const userId = getLocalUserId();
  const point = [event.pageX, event.pageY, event.pressure || 0.5];

  return {
    id: elementId,
    ownerId: userId,
    type: TOOLS.PENCIL.id,
    points: [point],
    strokeWidth: styles.size,
    color: styles.stroke,
    thinning: styles.thinning,
    smoothing: styles.smoothing,
    streamline: styles.streamline,
    roughElement: createTool(
      TOOLS.PENCIL.id,
      0, 0, 0, 0,
      styles.stroke,
      [point],
      styles.size,
      null,
      null,
      styles.thinning,
      styles.smoothing,
      styles.streamline,
    ),
  };
};

/**
 * Create a new shape element (rectangle, circle, diamond, arrow, line)
 * @param {Object} activeTool - Active tool object
 * @param {number} clientX - X coordinate
 * @param {number} clientY - Y coordinate
 * @param {Object} styles - Tool styles from useToolStyles
 * @returns {Object} New shape element
 */
export const createShapeElement = (activeTool, clientX, clientY, styles) => {
  const elementId = generateElementId();
  const userId = getLocalUserId();

  return {
    id: elementId,
    ownerId: userId,
    type: activeTool.id,
    x1: clientX,
    y1: clientY,
    x2: clientX,
    y2: clientY,
    strokeWidth: styles.size,
    color: styles.stroke,
    fill: styles.fillcolor,
    fillStyle: styles.fillStyle,
    roughElement: createTool(
      activeTool.id,
      clientX, clientY,
      clientX, clientY,
      styles.stroke,
      styles.size,
      styles.fillcolor,
      styles.fillStyle,
    ),
  };
};

/**
 * Create a new text element
 * @param {number} clientX - X coordinate
 * @param {number} clientY - Y coordinate
 * @param {Object} styles - Tool styles from useToolStyles
 * @returns {Object} New text element
 */
export const createTextElement = (clientX, clientY, styles) => {
  const elementId = generateElementId();
  const userId = getLocalUserId();

  return {
    id: elementId,
    ownerId: userId,
    type: TOOLS.TEXT.id,
    left: clientX,
    top: clientY,
    x1: clientX,
    y1: clientY,
    text: '',
    fontSize: styles.fontSize,
    color: styles.stroke,
  };
};

/**
 * Check if tool is a shape tool (rectangle, circle, diamond, arrow, line)
 * @param {Object} tool - Tool to check
 * @returns {boolean} True if shape tool
 */
export const isShapeTool = (tool) => {
  return [
    TOOLS.CIRCLE,
    TOOLS.RECTANGLE,
    TOOLS.DIAMOND,
    TOOLS.ARROW,
    TOOLS.LINE,
  ].includes(tool);
};

/**
 * Create shape move payload
 * @param {Object} activeTool - Active tool
 * @param {number} clientX - X coordinate
 * @param {number} clientY - Y coordinate
 * @param {Object} styles - Tool styles
 * @returns {Object} Shape move payload
 */
export const createShapeMovePayload = (activeTool, clientX, clientY, styles) => ({
  type: activeTool,
  x2: clientX,
  y2: clientY,
  color: styles.stroke,
  strokeWidth: styles.size,
  fill: styles.fillcolor,
  fillStyle: styles.fillStyle,
});
