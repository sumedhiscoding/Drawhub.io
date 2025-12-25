import React, { useContext } from "react";
import { COLORS, FILL_STYLES } from "../../utils/constants";
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
    console.log("Stroke width changed to:", width);
    dispatchToolBoxAction({
      type: "SET_STROKE_WIDTH",
      tool: activeTool,
      width: parseInt(width),
    });
  };

  const handleFillStyleChange = (fillStyle) => {
    dispatchToolBoxAction({
      type: "SET_FILL_STYLE",
      tool: activeTool,
      fillStyle,
    });
  };

  const toolboxStyle = {
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "16px",
    borderRadius: "8px",
    backgroundColor: "white",
    width: 'fit-content'
  };

  const sectionStyle = {
    marginBottom: "16px",
    padding: "8px",
    border: "1px solid #eee",
  };

  const h4Style = {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "bold",
  };

  const colorPaletteStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  };

  const colorButtonStyle = {
    width: "24px",
    height: "24px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const activeColorButtonStyle = {
    ...colorButtonStyle,
    border: "2px solid #000",
  };

  const noneButtonStyle = {
    width: "24px",
    height: "24px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
  };

  const strokeWidthStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const containerStyle = {
    position: "absolute",
    top: "40vh",
    right: "1vw",
  };

  return (
    <div style={containerStyle}>
      <div style={toolboxStyle}>
        <div style={sectionStyle}>
          <h4 style={h4Style}>Stroke Color</h4>
          <div style={colorPaletteStyle}>
            {Object.entries(COLORS).map(([name, hex]) => (
              <button
                key={name}
                style={{
                  ...(currentToolState?.stroke === hex
                    ? activeColorButtonStyle
                    : colorButtonStyle),
                  backgroundColor: hex,
                }}
                onClick={() => handleStrokeColorChange(hex)}
                title={name}
              />
            ))}
          </div>
        </div>

        {isPencil && (
          <div>
            <div style={sectionStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ flex: 1 }}>Thinning</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.thinning ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("thinning", Number(e.target.value))
                  }
                  style={{ flex: 3 }}
                />
                <span style={{ width: 32, textAlign: "right", marginLeft: 8 }}>
                  {pencilProps.thinning ?? 0.5}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ flex: 1 }}>Streamline</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.streamline ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("streamline", Number(e.target.value))
                  }
                  style={{ flex: 3 }}
                />
                <span style={{ width: 32, textAlign: "right", marginLeft: 8 }}>
                  {pencilProps.streamline ?? 0.5}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ flex: 1 }}>Smoothing</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={pencilProps.smoothing ?? 0.5}
                  onChange={(e) =>
                    handlePencilPropChange("smoothing", Number(e.target.value))
                  }
                  style={{ flex: 3 }}
                />
                <span style={{ width: 32, textAlign: "right", marginLeft: 8 }}>
                  {pencilProps.smoothing ?? 0.5}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ flex: 1 }}>Easing</span>
                <select
                  value={pencilProps.easing || "EaseInOutCubic"}
                  onChange={(e) =>
                    handlePencilPropChange("easing", e.target.value)
                  }
                  style={{ flex: 3, marginLeft: 8 }}
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
          <div style={sectionStyle}>
            <h4 style={h4Style}>Fill Color</h4>
            <div style={colorPaletteStyle}>
              <button
                style={
                  currentToolState?.fillcolor === null
                    ? { ...noneButtonStyle, border: "2px solid #000" }
                    : noneButtonStyle
                }
                onClick={() => handleFillColorChange(null)}
                title="No Fill"
              >
                /
              </button>
              {Object.entries(COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  style={{
                    ...(currentToolState?.fillcolor === hex
                      ? activeColorButtonStyle
                      : colorButtonStyle),
                    backgroundColor: hex,
                  }}
                  onClick={() => handleFillColorChange(hex)}
                  title={name}
                />
              ))}
            </div>
          </div>
        )}
        {currentToolState?.fillStyle !== undefined && (
          <div style={sectionStyle}>
            <h4 style={h4Style}>Fill Style</h4>
            <div>
              <select
                value={currentToolState?.fillStyle ?? ""}
                onChange={(e) => handleFillStyleChange(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  background: "#f9f9f9",
                  width: "100%",
                  outline: "none",
                  boxShadow: currentToolState?.fillStyle
                    ? "0 0 0 2px #0078d4"
                    : undefined,
                  marginTop: "4px",
                }}
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
        <div style={sectionStyle}>
          <h4 style={h4Style}>Stroke Width</h4>
          <div style={strokeWidthStyle}>
            <input
              type="range"
              min="1"
              max="10"
              value={currentToolState?.size || 1}
              onChange={(e) => handleStrokeWidthChange(e.target.value)}
            />
            <span>{currentToolState?.size || 1}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbox;
