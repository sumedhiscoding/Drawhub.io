import React from 'react';
import { Radio, Circle } from 'lucide-react';
import { useLiveSession } from '../../hooks/useLiveSession';

/**
 * Go Live Button Component
 * Allows canvas owner to start/stop live sessions for real-time collaboration
 */
const GoLiveButton = () => {
  const { isLive, isLoading, isCheckingStatus, toggleLiveSession } = useLiveSession();

  // Don't show button while checking status
  if (isCheckingStatus) {
    return null;
  }

  return (
    <button
      className={`toolbar-button ${isLive ? 'active' : ''}`}
      onClick={toggleLiveSession}
      disabled={isLoading}
      title={isLive ? 'Stop Live Session' : 'Go Live - Start real-time collaboration'}
      style={{
        position: 'relative',
        color: isLive ? '#ef4444' : undefined,
      }}
    >
      {isLive ? (
        <>
          <Radio size={19} className="animate-pulse" />
          <span
            className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </>
      ) : (
        <Circle size={19} />
      )}
    </button>
  );
};

export default GoLiveButton;
