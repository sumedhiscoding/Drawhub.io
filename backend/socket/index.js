import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { sql } from 'slonik';
import logger from '../config/logger.js';
import { socketConfig } from './config.js';
import { registerCanvasHandlers } from './handlers/canvas.socket.js';
import { registerUserHandlers } from './handlers/user.socket.js';
import { registerTestHandlers } from './handlers/test.socket.js';
import connectDatabase from '../config/db.js';

/**
 * Socket authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn(`Socket connection rejected: No token provided for ${socket.id}`);
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Fetch user from database
    const pool = await connectDatabase();
    const users = await pool.any(sql.unsafe`SELECT * FROM users WHERE id = ${decoded.sub}`);
    
    if (users.length === 0) {
      logger.warn(`Socket connection rejected: User not found for ${socket.id}`);
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    const { password: _, ...userWithoutPassword } = users[0];
    socket.user = userWithoutPassword;
    
    logger.info(`Socket authenticated: ${socket.id} for user ${userWithoutPassword.id}`);
    next();
  } catch (error) {
    logger.error(error, `Socket authentication failed for ${socket.id}`);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Initialize Socket.io server
 * @param {import('http').Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (httpServer) => {
  // Create Socket.io server
  const io = new Server(httpServer, socketConfig);

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id} (User ID: ${socket.user?.id})`);

    // Register all socket handlers
    registerCanvasHandlers(socket, io);
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

  // Create /canvas namespace
  const canvasNamespace = io.of('/canvas');
  canvasNamespace.use(authenticateSocket);

  canvasNamespace.on('connection', (socket) => {
    logger.info(`Client connected to /canvas: ${socket.id} (User ID: ${socket.user?.id})`);

    registerCanvasHandlers(socket, canvasNamespace);
    registerUserHandlers(socket);
    registerTestHandlers(socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected from /canvas: ${socket.id}, reason: ${reason}`);

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

    socket.on('error', (error) => {
      logger.error(error, `Socket error for /canvas client ${socket.id}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};
