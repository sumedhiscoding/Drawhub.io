import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { DEFAULT_NAMESPACE, SOURCE_TYPES } from '../utils/constants';

const buildSocketUrl = (baseUrl, namespace) => {
  if (!namespace || namespace === '/') {
    return baseUrl;
  }

  const hasTrailingSlash = baseUrl.endsWith('/');
  const hasLeadingSlash = namespace.startsWith('/');

  if (hasTrailingSlash && hasLeadingSlash) {
    return `${baseUrl.slice(0, -1)}${namespace}`;
  }

  if (!hasTrailingSlash && !hasLeadingSlash) {
    return `${baseUrl}/${namespace}`;
  }

  return `${baseUrl}${namespace}`;
};

const getLocalUserId = () => {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser);
    return parsed?.id ?? parsed?.userId ?? null;
  } catch (error) {
    console.error('Failed to parse local user data:', error);
    return null;
  }
};

/**
 * Canvas socket hook with room join and metadata-aware emitters.
 */
export const useCanvasSocket = ({
  canvasId,
  namespace = DEFAULT_NAMESPACE,
  onCanvasUpdate,
  updateSourceRef,
  getSyncState,
  onSyncState,
  autoJoin = true,
  autoSync = true,
} = {}) => {
  const socketRef = useRef(null);
  const canvasIdRef = useRef(canvasId);
  const desiredCanvasIdRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [isInRoom, setIsInRoom] = useState(false);

  const connectSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_SOCKET_URL;
    const socketUrl = buildSocketUrl(baseUrl, namespace);

    const socket = io(socketUrl, {
      auth: { token },
    });

    socket.on('connect', () => {
      setConnectionState('connected');
      console.log('Connected to socket');

      if (desiredCanvasIdRef.current) {
        socket.emit('canvas:join', desiredCanvasIdRef.current);
        setIsInRoom(true);
        if (autoSync) {
          socket.emit('canvas:sync-request', desiredCanvasIdRef.current);
        }
      }
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
      setIsInRoom(false);
      console.log('Disconnected from socket');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });

    socket.on('reconnect', () => {
      setConnectionState('connected');
      if (desiredCanvasIdRef.current) {
        socket.emit('canvas:join', desiredCanvasIdRef.current);
        setIsInRoom(true);
        if (autoSync) {
          socket.emit('canvas:sync-request', desiredCanvasIdRef.current);
        }
      }
    });

    socket.on('connect_error', (error) => {
      setConnectionState('disconnected');
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = socket;
    return socket;
  }, [namespace, autoSync]);

  useEffect(() => {
    const socket = connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [connectSocket]);

  useEffect(() => {
    canvasIdRef.current = canvasId;
  }, [canvasId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return undefined;
    }

    if (autoJoin && canvasId) {
      desiredCanvasIdRef.current = canvasId;
      if (socket.connected) {
        socket.emit('canvas:join', canvasId);
        setIsInRoom(true);
        if (autoSync) {
          socket.emit('canvas:sync-request', canvasId);
        }
      }
    }

    return () => {
      if (canvasId && socket.connected) {
        socket.emit('canvas:leave', canvasId);
      }
      if (desiredCanvasIdRef.current === canvasId) {
        desiredCanvasIdRef.current = null;
      }
      setIsInRoom(false);
    };
  }, [autoJoin, autoSync, canvasId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return undefined;
    }

    if (onCanvasUpdate) {
      console.log('onCanvasUpdate', onCanvasUpdate);
      console.log('updateSourceRef', updateSourceRef);
      console.log('socket', socket);
      const handler = (data) => {
        console.log('data', data);
        if (updateSourceRef) {
          updateSourceRef.current = SOURCE_TYPES.REMOTE;
        }
        const newData = { ...data, source: SOURCE_TYPES.REMOTE };
        console.log('newData', newData);
        onCanvasUpdate(newData);
      };
      socket.on('canvas:update', handler);
      return () => socket.off('canvas:update', handler);
    }

    return undefined;
  }, [onCanvasUpdate, updateSourceRef]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !onSyncState) {
      return undefined;
    }

    const handleElementsSync = (data) => {
      if (data?.elements) {
        onSyncState(data);
      }
    };

    const handleSyncResponse = (data) => {
      if (data?.state?.elements) {
        onSyncState({ elements: data.state.elements });
      }
    };

    socket.on('canvas:elements-sync', handleElementsSync);
    socket.on('canvas:sync-response', handleSyncResponse);

    return () => {
      socket.off('canvas:elements-sync', handleElementsSync);
      socket.off('canvas:sync-response', handleSyncResponse);
    };
  }, [onSyncState]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !getSyncState) {
      return undefined;
    }

    const handleSyncRequest = (data) => {
      const state = getSyncState();
      if (!state || !data?.requesterId) {
        return;
      }

      socket.emit('canvas:sync-response', {
        targetId: data.requesterId,
        canvasId: data.canvasId || canvasIdRef.current,
        state,
      });
    };

    socket.on('canvas:sync-request', handleSyncRequest);
    return () => socket.off('canvas:sync-request', handleSyncRequest);
  }, [getSyncState]);

  const joinCanvasRoom = useCallback(
    (targetCanvasId = canvasIdRef.current) => {
      const socket = connectSocket();
      if (!targetCanvasId || !socket) {
        return false;
      }

      desiredCanvasIdRef.current = targetCanvasId;
      if (socket.connected) {
        socket.emit('canvas:join', targetCanvasId);
        setIsInRoom(true);
        if (autoSync) {
          socket.emit('canvas:sync-request', targetCanvasId);
        }
      }
      return true;
    },
    [autoSync, connectSocket],
  );

  const leaveCanvasRoom = useCallback((targetCanvasId = canvasIdRef.current) => {
    const socket = socketRef.current;
    if (!targetCanvasId || !socket) {
      return false;
    }

    socket.emit('canvas:leave', targetCanvasId);
    if (desiredCanvasIdRef.current === targetCanvasId) {
      desiredCanvasIdRef.current = null;
    }
    setIsInRoom(false);
    return true;
  }, []);

  const requestSync = useCallback(() => {
    const socket = socketRef.current;
    const targetCanvasId = desiredCanvasIdRef.current || canvasIdRef.current;
    if (!socket || !targetCanvasId) {
      return false;
    }
    socket.emit('canvas:sync-request', targetCanvasId);
    return true;
  }, []);

  const emitCanvasUpdate = useCallback(
    ({
      command,
      elements,
      source = SOURCE_TYPES.LOCAL,
      updatedBy = getLocalUserId(),
      payload = {},
    }) => {
      const socket = connectSocket();

      if (!canvasId || !socket) {
        return;
      }

      if (!isInRoom && !autoJoin) {
        return;
      }

      if (updateSourceRef) {
        updateSourceRef.current = source;
      }

      socket.emit('canvas:update', {
        canvasId,
        command,
        elements,
        updatedBy: updatedBy,
        source,
        ...payload,
      });
    },
    [autoJoin, canvasId, connectSocket, isInRoom, updateSourceRef],
  );

  return {
    socketRef,
    emitCanvasUpdate,
    connectionState,
    isConnected: connectionState === 'connected',
    isInRoom,
    joinCanvasRoom,
    leaveCanvasRoom,
    requestSync,
  };
};

export default useCanvasSocket;
