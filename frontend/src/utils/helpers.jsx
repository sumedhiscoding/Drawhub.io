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
  thinning,
  smoothing,
  streamline,
  });

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