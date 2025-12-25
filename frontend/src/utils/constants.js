import { BsPencil } from "react-icons/bs";
import { BsCircle } from "react-icons/bs";
import { BsSquare } from "react-icons/bs";
import { BsDiamond } from "react-icons/bs";
import { BsArrowUpLeft } from "react-icons/bs";
import { BiSolidEraser } from "react-icons/bi";
import { BsEraser } from "react-icons/bs";
import { BsSlashLg } from "react-icons/bs";
import { IoIosUndo } from "react-icons/io";
import { IoIosRedo } from "react-icons/io";

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
  SET_ELEMENT: "SET_ELEMENT",
  SET_ACTIVE_TOOL: "SET_ACTIVE_TOOL",
  SET_COLOR: "SET_COLOR",
  SET_STROKE_WIDTH: "SET_STROKE_WIDTH",
  DRAW_DOWN: "DRAW_DOWN",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
};

export const TOOL_ACTION_TYPE = {
  NONE: "NONE",
  DRAW: "DRAW",
  ERASE: "ERASE",
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

