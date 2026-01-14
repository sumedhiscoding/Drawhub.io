import logger from '../../config/logger.js';

/**
 * Canvas-related socket event handlers
 */
export const registerCanvasHandlers = (socket) => {
  // Handle joining a canvas room
  socket.on('canvas:join', (canvasId) => {
    socket.join(`canvas:${canvasId}`);
    logger.info(`Client ${socket.id} joined canvas: ${canvasId}`);
    
    // Notify others in the room that a new user joined
    socket.to(`canvas:${canvasId}`).emit('canvas:user-joined', {
      socketId: socket.id,
      canvasId
    });
  });

  // Handle leaving a canvas room
  socket.on('canvas:leave', (canvasId) => {
    socket.leave(`canvas:${canvasId}`);
    logger.info(`Client ${socket.id} left canvas: ${canvasId}`);
    
    // Notify others in the room that a user left
    socket.to(`canvas:${canvasId}`).emit('canvas:user-left', {
      socketId: socket.id,
      canvasId
    });
  });

  // Handle canvas updates (drawing, shapes, etc.)
  socket.on('canvas:update', (data) => {
    const { canvasId, ...updateData } = data;
    
    if (canvasId) {
      // Broadcast to all clients in the same canvas room (except sender)
      socket.to(`canvas:${canvasId}`).emit('canvas:update', updateData);
      logger.debug(`Canvas update broadcasted for canvas: ${canvasId}`);
    } else {
      // Fallback: broadcast to all connected clients
      socket.broadcast.emit('canvas:update', updateData);
    }
  });

  // Handle canvas state sync request
  socket.on('canvas:sync-request', (canvasId) => {
    // Request state sync from other clients in the room
    socket.to(`canvas:${canvasId}`).emit('canvas:sync-request', {
      requesterId: socket.id,
      canvasId
    });
  });

  // Handle canvas state sync response
  socket.on('canvas:sync-response', (data) => {
    const { targetId, canvasId, state } = data;
    
    if (targetId) {
      // Send sync data to specific client
      socket.to(targetId).emit('canvas:sync-response', {
        canvasId,
        state
      });
    }
  });

  // Handle cursor position updates
  socket.on('canvas:cursor-update', (data) => {
    const { canvasId, cursor } = data;
    
    if (canvasId) {
      socket.to(`canvas:${canvasId}`).emit('canvas:cursor-update', {
        socketId: socket.id,
        cursor
      });
    }
  });
};
