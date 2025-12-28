import React, { act, useContext } from "react";
import { COLORS, FILL_STYLES, TOOLS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";
import { BoardContext } from "../../store/board/board-context";
import { easingOptions } from "../../utils/constants";
const Toolbox = () => {
  const { toolBoxState, dispatchToolBoxAction } = useContext(toolboxContext);
  const { activeTool } = useContext(BoardContext);

  const currentToolState = toolBoxState[activeTool.name];

  const isPencil = activeTool?.name === "Pencil";

  const pencilProps = currentToolState || {};

  const handlePencilPropChange = (prop, value) => {
    dispatchToolBoxAction({
      type: "SET_PENCIL_PROP",
      tool: activeTool,
      prop,
      value,
    });
  };
  const handleStrokeColorChange = (color) => {
    dispatchToolBoxAction({
      type: "SET_STROKE_COLOR",
      tool: activeTool,
      color,
    });
  };

  const handleFillColorChange = (color) => {
    dispatchToolBoxAction({
      type: "SET_FILL_COLOR",
      tool: activeTool,
      color,
    });
  };

  const handleStrokeWidthChange = (width) => {
    if (activeTool.name === TOOLS.TEXT.name) {
      dispatchToolBoxAction({
        type: "SET_FONT_SIZE",
        tool: activeTool,
        fontSize: parseInt(width),
      });
    } else {
      dispatchToolBoxAction({
        type: "SET_STROKE_WIDTH",
        tool: activeTool,
        width: parseInt(width),
      });
    }
  };

  const handleFillStyleChange = (fillStyle) => {
    dispatchToolBoxAction({
      type: "SET_FILL_STYLE",
      tool: activeTool,
      fillStyle,
    });
  };

  // ...existing code...

  return (
    <div className="toolbox-container">
      <div className="toolbox">
        <div className="toolbox-section">
          <h4 className="toolbox-h4">Stroke Color</h4>
          <div className="toolbox-color-palette">
            {Object.entries(COLORS).map(([name, hex]) => (
              <button
                key={name}
                className={`toolbox-color-btn${
                  currentToolState?.stroke === hex
                    ? " toolbox-color-btn-active"
                    : ""
                }`}
                style={{ backgroundColor: hex }}
                onClick={() => handleStrokeColorChange(hex)}
                title={name}
              />
            ))}
          </div>
        </div>

        {isPencil && (
          <div>
            <div className="toolbox-section">
              <div className="toolbox-flex">
                <span className="toolbox-flex-label">Thinning</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.thinning ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("thinning", Number(e.target.value))
                  }
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.thinning ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-label">Streamline</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.streamline ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("streamline", Number(e.target.value))
                  }
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.streamline ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-label">Smoothing</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.smoothing ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("smoothing", Number(e.target.value))
                  }
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.smoothing ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-1">Easing</span>
                <select
                  value={pencilProps.easing || "EaseInOutCubic"}
                  onChange={(e) =>
                    handlePencilPropChange("easing", e.target.value)
                  }
                  className={`toolbox-select${
                    pencilProps.easing ? " toolbox-select-active" : ""
                  }`}
                  style={{ marginTop: "4px" }}
                >
                  {easingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {currentToolState?.fillcolor !== undefined && (
          <div className="toolbox-section">
            <h4 className="toolbox-h4">Fill Color</h4>
            <div className="toolbox-color-palette">
              <button
                className={`toolbox-none-btn${
                  currentToolState?.fillcolor === null
                    ? " toolbox-color-btn-active"
                    : ""
                }`}
                onClick={() => handleFillColorChange(null)}
                title="No Fill"
              >
                /
              </button>
              {Object.entries(COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  className={`toolbox-color-btn${
                    currentToolState?.fillcolor === hex
                      ? " toolbox-color-btn-active"
                      : ""
                  }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleFillColorChange(hex)}
                  title={name}
                />
              ))}
            </div>
          </div>
        )}

        {currentToolState?.fillStyle !== undefined && (
          <div className="toolbox-section">
            <h4 className="toolbox-h4">Fill Style</h4>
            <div>
              <select
                value={currentToolState?.fillStyle ?? ""}
                onChange={(e) => handleFillStyleChange(e.target.value)}
                className={`toolbox-select${
                  currentToolState?.fillStyle ? " toolbox-select-active" : ""
                }`}
                style={{ marginTop: "4px" }}
              >
                <option value="">No Fill Style</option>
                {Object.entries(FILL_STYLES).map(([name, style]) => (
                  <option key={name} value={style}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="toolbox-section">
          <h4 className="toolbox-h4">Stroke Width</h4>
          <div className="toolbox-stroke-width">
            {/* Slider for TEXT tool */}
            {activeTool.name === TOOLS.TEXT.name && (
              <>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={currentToolState?.fontSize || 16}
                  onChange={(e) => handleStrokeWidthChange(e.target.value)}
                />
                <span>{currentToolState?.fontSize || 16}px</span>
              </>
            )}
            {/* Slider for Pencil tool */}
            <div className="toolbox-stroke-width">
              {activeTool.name === TOOLS.PENCIL?.name && (
                <>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={currentToolState?.size || 2}
                    onChange={(e) => handleStrokeWidthChange(e.target.value)}
                    className="slider-range-input slider-track smooth-transition"
                  />
                  <span className="slider-label">
                    {currentToolState?.size || 2}px
                  </span>
                </>
              )}
              {/* Slider for all other tools */}
              {activeTool.name !== TOOLS.TEXT.name &&
                activeTool.name !== TOOLS.PENCIL?.name && (
                  <>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentToolState?.size || 1}
                      onChange={(e) => handleStrokeWidthChange(e.target.value)}
                      className="slider-range-input slider-track smooth-transition"
                    />
                    <span className="slider-label">
                      {currentToolState?.size || 1}px
                    </span>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbox;
