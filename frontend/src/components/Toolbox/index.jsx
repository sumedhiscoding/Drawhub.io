import React, { act, useContext } from "react";
import { COLORS, FILL_STYLES, TOOLS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";
import { BoardContext } from "../../store/board/board-context";

import { easingOptions } from "../../utils/constants";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



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
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[pencilProps.thinning ?? 0.5]}
                  onValueChange={([val]) => handlePencilPropChange("thinning", val)}
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.thinning ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-label">Streamline</span>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[pencilProps.streamline ?? 0.5]}
                  onValueChange={([val]) => handlePencilPropChange("streamline", val)}
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.streamline ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-label">Smoothing</span>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[pencilProps.smoothing ?? 0.5]}
                  onValueChange={([val]) => handlePencilPropChange("smoothing", val)}
                  className="toolbox-flex-slider"
                />
                <span className="toolbox-flex-value">
                  {pencilProps.smoothing ?? 0.5}
                </span>
              </div>
              <div className="toolbox-flex">
                <span className="toolbox-flex-1">Easing</span>
                <Select
                  value={pencilProps.easing || "EaseInOutCubic"}
                  onValueChange={(val) => handlePencilPropChange("easing", val)}
                >
                  <SelectTrigger className={`toolbox-select${pencilProps.easing ? " toolbox-select-active" : ""}`} style={{ marginTop: "4px" }}>
                    <SelectValue placeholder="Select Easing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Easing</SelectLabel>
                      {easingOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
              <Select
                value={currentToolState?.fillStyle ?? ""}
                onValueChange={(val) => handleFillStyleChange(val)}
              >
                <SelectTrigger className={`toolbox-select${currentToolState?.fillStyle ? " toolbox-select-active" : ""}`} style={{ marginTop: "4px" }}>
                  <SelectValue placeholder="No Fill Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Fill Style</SelectLabel>
                    {/* Remove invalid empty value SelectItem, rely on placeholder instead */}
                    {Object.entries(FILL_STYLES).map(([name, style]) => (
                      <SelectItem key={name} value={style}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="toolbox-section">
          <h4 className="toolbox-h4">Stroke Width</h4>
          <div className="toolbox-stroke-width">
            {activeTool.name === TOOLS.TEXT.name ? (
              <>
                <Slider
                  min={8}
                  max={72}
                  step={1}
                  value={[currentToolState?.fontSize || 16]}
                  onValueChange={([val]) => handleStrokeWidthChange(val)}
                  className="toolbox-flex-slider"
                />
                <span>{currentToolState?.fontSize || 16}px</span>
              </>
            ) : activeTool.name === TOOLS.PENCIL?.name ? (
              <>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[currentToolState?.size || 2]}
                  onValueChange={([val]) => handleStrokeWidthChange(val)}
                  className="toolbox-flex-slider"
                />
                <span className="slider-label">
                  {currentToolState?.size || 2}px
                </span>
              </>
            ) : (
              <>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[currentToolState?.size || 1]}
                  onValueChange={([val]) => handleStrokeWidthChange(val)}
                  className="toolbox-flex-slider"
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
  );
};

export default Toolbox;
