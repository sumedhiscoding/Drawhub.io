import React, { useContext } from 'react';
import { COLORS, FILL_STYLES } from '../../utils/constants';
import toolboxContext from '../../store/board/toolbar-context';
import { BoardContext } from '../../store/board/board-context';

const Toolbox = () => {
  const { toolBoxState, dispatchToolBoxAction } = useContext(toolboxContext);
  const { activeTool } = useContext(BoardContext);

  const currentToolState = toolBoxState[activeTool.name];
  console.log('Current Tool State:', currentToolState ,activeTool);
  const handleStrokeColorChange = (color) => {
    dispatchToolBoxAction({
      type: 'SET_STROKE_COLOR',
      tool: activeTool,
      color,
    });
  };

  const handleFillColorChange = (color) => {
    dispatchToolBoxAction({
      type: 'SET_FILL_COLOR',
      tool: activeTool,
      color,
    });
  };

  const handleStrokeWidthChange = (width) => {
    dispatchToolBoxAction({
      type: 'SET_STROKE_WIDTH',
      tool: activeTool,
      width: parseInt(width),
    });
  };

  const handleFillStyleChange = (fillStyle) => {
    console.log('Selected Fill Style:', fillStyle);
    dispatchToolBoxAction({
      type: 'SET_FILL_STYLE',
      tool: activeTool,
      fillStyle,
    });
  };

  const toolboxStyle = {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: 'white',
    width: '200px',
  };

  const sectionStyle = {
    marginBottom: '16px',
  };

  const h4Style = {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const colorPaletteStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  };

  const colorButtonStyle = {
    width: '24px',
    height: '24px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const activeColorButtonStyle = {
    ...colorButtonStyle,
    border: '2px solid #000',
  };

  const noneButtonStyle = {
    width: '24px',
    height: '24px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
  };

  const strokeWidthStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const containerStyle = {
    position: 'absolute',
    top: '40vh',
    right: '1vw',
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
                ...(currentToolState?.stroke === hex ? activeColorButtonStyle : colorButtonStyle),
                backgroundColor: hex,
              }}
              onClick={() => handleStrokeColorChange(hex)}
              title={name}
            />
          ))}
        </div>
      </div>
      {currentToolState?.fillcolor !== undefined && (
        <div style={sectionStyle}>
          <h4 style={h4Style}>Fill Color</h4>
          <div style={colorPaletteStyle}>
            <button
              style={currentToolState?.fillcolor === null ? { ...noneButtonStyle, border: '2px solid #000' } : noneButtonStyle}
              onClick={() => handleFillColorChange(null)}
              title="No Fill"
            >
              /
            </button>
            {Object.entries(COLORS).map(([name, hex]) => (
              <button
                key={name}
                style={{
                  ...(currentToolState?.fillcolor === hex ? activeColorButtonStyle : colorButtonStyle),
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
              value={currentToolState?.fillStyle ?? ''}
              onChange={e => handleFillStyleChange(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                background: '#f9f9f9',
                width: '100%',
                outline: 'none',
                boxShadow: currentToolState?.fillStyle ? '0 0 0 2px #0078d4' : undefined,
                marginTop: '4px'
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