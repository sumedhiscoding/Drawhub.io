import { TOOLS } from "./constants";

export const createTool = (
  id, // e.g., "line"
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth,
  generator,
  fill,
  fillStyle,
) => {
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
    default:
      throw new Error(`Unknown tool type: ${id}`);
  }
};
