import { BsPencil,  } from "react-icons/bs";
import { BsCircle } from "react-icons/bs";
import { BsSquare } from "react-icons/bs";
import { BsDiamond } from "react-icons/bs";
import { BsArrowUpLeft } from "react-icons/bs";
import { BsEraser } from "react-icons/bs";
import { BsSlashLg } from "react-icons/bs";
import { IoIosUndo } from "react-icons/io";
import { IoIosRedo } from "react-icons/io";
import { IoTextOutline  } from "react-icons/io5";
export const TOOLS = {
  PENCIL: {
    id: "pencil",
    icon: BsPencil,
    name: "Pencil",
  },
  CIRCLE: {
    id: "circle",
    icon: BsCircle,
    name: "Circle",
  },
  RECTANGLE: {
    id: "rectangle",
    icon: BsSquare,
    name: "Rectangle",
  },
  DIAMOND: {
    id: "diamond",
    icon: BsDiamond,
    name: "Diamond",
  },
  ARROW: {
    id: "arrow",
    icon: BsArrowUpLeft,
    name: "Arrow",
  },
  ERASER: {
    id: "eraser",
    icon: BsEraser,
    name: "Eraser",
  },
  LINE: {
    id: "line",
    icon: BsSlashLg,
    name: "LINE",
  },
  TEXT:{
    id: "text",
    icon: IoTextOutline,
    name: "Text",
  }
};

export const ACTIONS = {
  UNDO: {
    id: "undo",
    icon: IoIosUndo,
    name: "Undo",
  },
  REDO: {
    id: "redo",
    icon: IoIosRedo,
    name: "Redo",
  },
};

export const ALLOWED_METHODS = {
  SET_ELEMENTS: "SET_ELEMENTS",
  SET_ACTIVE_TOOL: "SET_ACTIVE_TOOL",
  SET_COLOR: "SET_COLOR",
  DRAW_DOWN: "DRAW_DOWN",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
  CLEAR_BOARD: "CLEAR_BOARD",
  ERASE_ELEMENT: "ERASE_ELEMENT",
  ADD_TEXT: "ADD_TEXT",
  SAVE_TEXT: "SAVE_TEXT",
  UNDO: "UNDO",
  REDO: "REDO",
};

export const TOOL_ACTION_TYPE = {
  NONE: "NONE",
  DRAW: "DRAW",
  ERASE: "ERASE",
  WRITE: "WRITE",
};

export const DEFAULT_TOOL = TOOLS.PEN;

export const COLORS = {
  Black: "#000000",
  Red: "#FF0000",
  Green: "#00FF00",
  Blue: "#0000FF",
  Yellow: "#FFFF00",
  Magenta: "#FF00FF",
  Cyan: "#00FFFF",
  White: "#FFFFFF",
};

export const FILL_STYLES = {
  HACHURE: 'hachure',
  SOLID: 'solid',
  ZIGZAG: 'zigzag',
  CROSSHATCH: 'cross-hatch',
  DOTS: 'dots',
  SUNBURST: 'sunburst',
  DASHED: 'dashed',
  ZIGZAGLINE: 'zigzag-line',
};

 export const easingOptions = [
    "EaseInOutCubic",
    "Linear",
    "EaseInQuad",
    "EaseOutQuad",
    "EaseInOutQuad",
    "EaseInCubic",
    "EaseOutCubic",
    "EaseInQuart",
    "EaseOutQuart",
    "EaseInOutQuart",
  ];