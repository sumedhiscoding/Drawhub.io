import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { socketConfig } from './config.js';
import { registerCanvasHandlers } from './handlers/canvas.socket.js';
import { registerUserHandlers } from './handlers/user.socket.js';
import { registerTestHandlers } from './handlers/test.socket.js';
/**
 * Initialize Socket.io server
 * @param {import('http').Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (httpServer) => {
  // Create Socket.io server
  const io = new Server(httpServer, socketConfig);

  // Handle connections
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Register all socket handlers
    registerCanvasHandlers(socket);
    registerUserHandlers(socket);
    registerTestHandlers(socket);
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      
      // Notify all rooms the user was in that they left
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('canvas:')) {
          socket.to(room).emit('canvas:user-left', {
            socketId: socket.id,
            canvasId: room.replace('canvas:', '')
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(error, `Socket error for client ${socket.id}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};
