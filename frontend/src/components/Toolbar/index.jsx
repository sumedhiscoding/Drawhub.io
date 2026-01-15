import React from 'react';
import { useParams } from 'react-router';
import { useToolBarHandlers } from '../../hooks/useToolBarHandlers';
import ToolButtons from './ToolButtons';
import ToolSettings from './ToolSettings';
import ShareDialog from './ShareDialog';
import GoLiveButton from './GoLiveButton';

const Toolbar = () => {
  const { id: canvasId } = useParams();

  const { handleGoLive, isLive, connectionState, ...toolBarHandlersProps } =
    useToolBarHandlers(canvasId);

  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <ToolButtons />
        <ToolSettings />
        <ShareDialog shareProps={toolBarHandlersProps} />
        <GoLiveButton
          isLive={isLive}
          handleGoLive={handleGoLive}
          connectionState={connectionState}
        />
      </div>
    </div>
  );
};

export default Toolbar;
