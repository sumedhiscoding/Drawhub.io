import React from 'react';
import { Radio } from 'lucide-react';

/**
 * Component for the Go Live button
 * @param {boolean} isLive - Whether the canvas is currently live
 * @param {Function} handleGoLive - Function to handle going live
 * @param {string} connectionState - Socket connection status
 */
const GoLiveButton = ({ isLive, handleGoLive, connectionState }) => {
  const statusClass = isLive
    ? ' bg-green-500/20 border-green-500'
    : connectionState === 'reconnecting' || connectionState === 'connecting'
      ? ' bg-yellow-500/20 border-yellow-500'
      : connectionState === 'disconnected'
        ? ' bg-red-500/20 border-red-500'
        : '';

  const statusTitle = isLive
    ? 'Canvas is live'
    : connectionState === 'reconnecting'
      ? 'Reconnecting...'
      : connectionState === 'connecting'
        ? 'Connecting...'
        : connectionState === 'disconnected'
          ? 'Disconnected'
          : 'Go live';

  return (
    <button className={`toolbar-button${statusClass}`} title={statusTitle} onClick={handleGoLive}>
      {isLive ? (
        <Radio size={19} className="text-green-600" />
      ) : connectionState === 'reconnecting' || connectionState === 'connecting' ? (
        <Radio size={19} className="text-yellow-600" />
      ) : connectionState === 'disconnected' ? (
        <Radio size={19} className="text-red-600" />
      ) : (
        <Radio size={19} />
      )}
    </button>
  );
};

export default GoLiveButton;
