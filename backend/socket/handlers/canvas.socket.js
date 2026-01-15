import logger from '../../config/logger.js';
import { findCanvasById } from '../../controllers/CanvasControllers/findCanvasById.js';

/**
 * Canvas-related socket event handlers
 */
export const registerCanvasHandlers = (socket, io) => {
  // Handle joining a canvas room
  socket.on('canvas:join', async (canvasId) => {
    try {
      const userId = socket.user?.id;
      
      if (!userId) {
        socket.emit('canvas:error', { message: 'Authentication required' });
        return;
      }

      // Fetch canvas data including elements and owner info
      const canvas = await findCanvasById(canvasId);
      
      if (!canvas) {
        socket.emit('canvas:error', { message: 'Canvas not found' });
        return;
      }

      // Check if user has access (owner or shared user)
      const isOwner = canvas.owner_id === userId;
      const isShared = canvas.shared_with_ids?.includes(userId) || false;
      
      if (!isOwner && !isShared) {
        socket.emit('canvas:unauthorized', { message: 'You do not have access to this canvas' });
        return;
      }

      // Join the canvas room
      socket.join(`canvas:${canvasId}`);
      logger.info(`Client ${socket.id} (User ${userId}) joined canvas: ${canvasId} (Owner: ${isOwner})`);

      // Send confirmation to the joining user
      socket.emit('canvas:joined', {
        canvasId,
        isOwner
      });

      // Send existing elements to the newly joined user
      if (canvas.elements && canvas.elements.length > 0) {
        socket.emit('canvas:elements-sync', {
          canvasId,
          elements: canvas.elements
        });
        logger.info(`Sent ${canvas.elements.length} elements to user ${userId} for canvas ${canvasId}`);
      }

      // Notify others in the room that a new user joined
      socket.to(`canvas:${canvasId}`).emit('canvas:user-joined', {
        socketId: socket.id,
        userId,
        canvasId,
        isOwner
      });

      // If owner joined, broadcast special event
      if (isOwner) {
        io.to(`canvas:${canvasId}`).emit('canvas:owner-joined', {
          socketId: socket.id,
          userId,
          canvasId
        });
        logger.info(`Canvas owner ${userId} joined canvas ${canvasId}`);
      }
    } catch (error) {
      logger.error(error, `Error handling canvas:join for ${socket.id}`);
      socket.emit('canvas:error', { message: 'Failed to join canvas' });
    }
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
