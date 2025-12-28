import { TOOLS } from "./constants";
import {getStroke} from "perfect-freehand";
import rough from "roughjs";
export const createTool = (
  id, 
  x1,
  y1,
  x2,
  y2,
  color,
  points,
  strokeWidth,
  fill,
  fillStyle,
  thinning = 0.5,
  smoothing = 0.5,
  streamline = 0.5,

) => {
  console.log("Creating tool:", {
  color,
  thinning,
  smoothing,
  streamline,}  )
  const generator = rough.generator();
  switch (id) {
    case TOOLS.LINE.id:
      return generator.line(x1, y1, x2, y2, { stroke: color, strokeWidth });
    case TOOLS.RECTANGLE.id:
      return generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
        stroke: color,
        strokeWidth,
        fill,
        fillStyle,
      });
    case TOOLS.CIRCLE.id: {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return generator.circle(x1, y1, radius * 2, {
        stroke: color,
        strokeWidth,
        fill,
        fillStyle,
      });
    }
    case TOOLS.DIAMOND.id: {
      // Calculate the four points dynamically based on x1,y1 -> x2,y2
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const points = [
        [midX, y1], // top
        [x2, midY], // right
        [midX, y2], // bottom
        [x1, midY], // left
      ];

      return generator.polygon(points, { stroke: color, strokeWidth, fill, fillStyle });
    }

    case TOOLS.ARROW.id: {
      // Vector from start to end
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0)
        return generator.line(x1, y1, x2, y2, { stroke: color, strokeWidth });

      // Unit vector
      const ux = dx / length;
      const uy = dy / length;

      // Arrowhead size
      const headLength = 10;

      // Points for arrowhead
      const arrowLeftX = x2 - headLength * (ux + uy);
      const arrowLeftY = y2 - headLength * (uy - ux);
      const arrowRightX = x2 - headLength * (ux - uy);
      const arrowRightY = y2 - headLength * (uy + ux);

      // Draw main line + arrowhead
      return generator.linearPath(
        [
          [x1, y1], // start
          [x2, y2], // end
          [arrowLeftX, arrowLeftY],
          [x2, y2],
          [arrowRightX, arrowRightY],
        ],
        { stroke: color, strokeWidth }
      );
    }
    case TOOLS.PENCIL.id:{
      console.log("Creating PENCIL rough element with points:",color, points,{thinning, smoothing, streamline, size: strokeWidth,
        start: {
        cap: true,
        taper: 0,
        easing: (t) => t,
        },
        end: {
          cap: true,
          taper: 0,
          easing: (t) => t,
        },});
      const stroke = getStroke(points,{thinning, smoothing, streamline, size: strokeWidth,
        start: {
        cap: true,
        taper: 0,
        easing: (t) => t,
        },
        end: {
          cap: true,
          taper: 0,
          easing: (t) => t,
        },});
      const path = getSvgPathFromStroke(stroke);
      return path;
    }
    case TOOLS.TEXT.id:{
      return null; // Text tool does not have a rough element
    }
    default:
      throw new Error(`Unknown tool type: ${id}`);
  }
};


export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return ""

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ["M", ...stroke[0], "Q"]
  )

  d.push("Z")
  return d.join(" ")
}


export const isPointNearElement = (x, y, element, offset = 10) => {
  const { type, x1, y1, x2, y2, points } = element;
  switch (type) {
    case TOOLS.LINE.id:
    case TOOLS.ARROW.id:
      return isPointNearLineSegment(x, y, x1, y1, x2, y2, offset);

    case TOOLS.RECTANGLE.id:
      return isPointNearRectangleBorder(x, y, x1, y1, x2, y2, offset);

    case TOOLS.CIRCLE.id: {
      return isPointNearCircle(x, y, x1, y1, x2, y2, offset);
    }

    case TOOLS.DIAMOND.id: {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const diamondPoints = [
        [midX, y1],
        [x2, midY],
        [midX, y2],
        [x1, midY],
      ];
      return isPointNearPolygon(x, y, diamondPoints, offset);
    }

    case TOOLS.PENCIL.id:
      if (Array.isArray(points)) {
        return points.some(([px, py]) => Math.hypot(x - px, y - py) <= offset);
      }
      return false;

    default:
      return false;
  }
};
const isPointNearLineSegment = (px, py, x1, y1, x2, y2, offset) => {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1) <= offset;
  }

  const t =
    ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));

  const closestX = x1 + clampedT * dx;
  const closestY = y1 + clampedT * dy;

  const distance = Math.hypot(px - closestX, py - closestY);

  return distance <= offset;
};
const isPointNearRectangleBorder = (x, y, x1, y1, x2, y2, offset) => {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return (
    isPointNearLineSegment(x, y, minX, minY, maxX, minY, offset) ||
    isPointNearLineSegment(x, y, maxX, minY, maxX, maxY, offset) ||
    isPointNearLineSegment(x, y, maxX, maxY, minX, maxY, offset) ||
    isPointNearLineSegment(x, y, minX, maxY, minX, minY, offset)
  );
};
const isPointNearCircle = (x, y, cx, cy, px, py, offset=10) => {
  // radius = distance from center to any point on circumference
  const radius = Math.hypot(px - cx, py - cy);
  // distance from center to test point
  const dist = Math.hypot(x - cx, y - cy);
  // near the circle edge (not inside)
  return Math.abs(dist - radius) <= offset;
};
const isPointNearPolygon = (x, y, points, offset) => {
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    if (isPointNearLineSegment(x, y, x1, y1, x2, y2, offset)) {
      return true;
    }
  }
  return false;
};
