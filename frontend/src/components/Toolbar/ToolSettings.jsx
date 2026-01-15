import React, { useContext } from 'react';
import { TOOLS, COLORS, FILL_STYLES, easingOptions } from '../../utils/constants';
import { BoardContext } from '../../store/Context/BoardContext';
import toolboxContext from '../../store/Context/ToolBoxContext';
import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import useToolBoxHandler from '../../hooks/useToolBoxHandler';

const ToolSettings = () => {
  const { activeTool } = React.useContext(BoardContext);
  const { toolBoxState } = useContext(toolboxContext);
  const {
    handlePencilPropChange,
    handleStrokeColorChange,
    handleFillColorChange,
    handleStrokeWidthChange,
    handleFillStyleChange,
  } = useToolBoxHandler();

  const currentToolState = toolBoxState[activeTool.name];
  const isPencil = activeTool?.name === 'Pencil';
  const pencilProps = currentToolState || {};

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="toolbar-button" title="Tool Settings">
          <Settings size={19} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-4 max-h-[80vh] overflow-y-auto modern-scrollbar mt-4"
      >
        <div className="space-y-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground">Tool Settings</h3>
          <p className="text-xs text-muted-foreground">
            Customize your {activeTool?.name || 'tool'} properties
          </p>
        </div>
        <Accordion
          type="multiple"
          defaultValue={['stroke-color', 'stroke-width']}
          className="w-full"
        >
          <AccordionItem value="stroke-color">
            <AccordionTrigger className="toolbox-h4 py-2">Stroke Color</AccordionTrigger>
            <AccordionContent>
              <div className="toolbox-color-palette">
                {Object.entries(COLORS).map(([name, hex]) => (
                  <button
                    key={name}
                    className={`toolbox-color-btn${
                      currentToolState?.stroke === hex ? ' toolbox-color-btn-active' : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleStrokeColorChange(hex)}
                    title={name}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {isPencil && (
            <AccordionItem value="pencil-settings">
              <AccordionTrigger className="toolbox-h4 py-2">Pencil Settings</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="toolbox-flex">
                    <span className="toolbox-flex-label">Thinning</span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[pencilProps.thinning ?? 0.5]}
                      onValueChange={([val]) => handlePencilPropChange('thinning', val)}
                      className="toolbox-flex-slider"
                    />
                    <span className="toolbox-flex-value">{pencilProps.thinning ?? 0.5}</span>
                  </div>
                  <div className="toolbox-flex">
                    <span className="toolbox-flex-label">Streamline</span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[pencilProps.streamline ?? 0.5]}
                      onValueChange={([val]) => handlePencilPropChange('streamline', val)}
                      className="toolbox-flex-slider"
                    />
                    <span className="toolbox-flex-value">{pencilProps.streamline ?? 0.5}</span>
                  </div>
                  <div className="toolbox-flex">
                    <span className="toolbox-flex-label">Smoothing</span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[pencilProps.smoothing ?? 0.5]}
                      onValueChange={([val]) => handlePencilPropChange('smoothing', val)}
                      className="toolbox-flex-slider"
                    />
                    <span className="toolbox-flex-value">{pencilProps.smoothing ?? 0.5}</span>
                  </div>
                  <div className="toolbox-flex">
                    <span className="toolbox-flex-1">Easing</span>
                    <Select
                      value={pencilProps.easing || 'EaseInOutCubic'}
                      onValueChange={(val) => handlePencilPropChange('easing', val)}
                    >
                      <SelectTrigger
                        className={`toolbox-select${
                          pencilProps.easing ? ' toolbox-select-active' : ''
                        }`}
                        style={{ marginTop: '4px' }}
                      >
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
              </AccordionContent>
            </AccordionItem>
          )}

          {currentToolState?.fillcolor !== undefined && (
            <AccordionItem value="fill-color">
              <AccordionTrigger className="toolbox-h4 py-2">Fill Color</AccordionTrigger>
              <AccordionContent>
                <div className="toolbox-color-palette">
                  <button
                    className={`toolbox-none-btn${
                      currentToolState?.fillcolor === null ? ' toolbox-color-btn-active' : ''
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
                        currentToolState?.fillcolor === hex ? ' toolbox-color-btn-active' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                      onClick={() => handleFillColorChange(hex)}
                      title={name}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {currentToolState?.fillStyle !== undefined && (
            <AccordionItem value="fill-style">
              <AccordionTrigger className="toolbox-h4 py-2">Fill Style</AccordionTrigger>
              <AccordionContent>
                <Select
                  value={currentToolState?.fillStyle ?? ''}
                  onValueChange={(val) => handleFillStyleChange(val)}
                >
                  <SelectTrigger
                    className={`toolbox-select${
                      currentToolState?.fillStyle ? ' toolbox-select-active' : ''
                    }`}
                    style={{ marginTop: '4px' }}
                  >
                    <SelectValue placeholder="No Fill Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fill Style</SelectLabel>
                      {Object.entries(FILL_STYLES).map(([name, style]) => (
                        <SelectItem key={name} value={style}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="stroke-width">
            <AccordionTrigger className="toolbox-h4 py-2">Text Size</AccordionTrigger>
            <AccordionContent>
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
                    <span className="slider-label">{currentToolState?.size || 2}px</span>
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
                    <span className="slider-label">{currentToolState?.size || 1}px</span>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ToolSettings;
