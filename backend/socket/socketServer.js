import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { findCanvasById } from '../controllers/CanvasControllers/findCanvasById.js';
import liveSessionService from '../services/liveSessionService.js';

/**
 * Initialize Socket.IO server with authentication and live session room management
 * 
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export const initializeSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth or headers
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info to socket
      // JWT uses 'sub' field for user ID (as per authRoutes.js)
      socket.userId = decoded.sub || decoded.id;
      socket.user = decoded;
      
      next();
    } catch (error) {
      logger.error(error, "Socket authentication failed");
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', async (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join canvas room (for live sessions)
    socket.on('join-canvas', async (canvasId) => {
      try {
        // Validate canvasId
        if (!canvasId || typeof canvasId !== 'string') {
          socket.emit('error', { message: 'Invalid canvas ID' });
          return;
        }

        // Verify user has access to canvas
        const canvas = await findCanvasById(canvasId);
        
        if (!canvas) {
          socket.emit('error', { message: 'Canvas not found' });
          return;
        }

        // Check if user has access (owner or shared)
        // Convert both to numbers for comparison (PostgreSQL returns integers, JWT might be string)
        const userId = Number(socket.userId);
        const ownerId = Number(canvas.owner_id);
        
        const isOwner = ownerId === userId;
        
        // Check if user is in shared_with_ids array
        // Handle both null/undefined and ensure proper type comparison
        let isShared = false;
        if (canvas.shared_with_ids) {
          if (Array.isArray(canvas.shared_with_ids)) {
            isShared = canvas.shared_with_ids.some(id => Number(id) === userId);
          } else if (typeof canvas.shared_with_ids === 'string') {
            // Handle case where it might be a string representation
            try {
              const parsed = JSON.parse(canvas.shared_with_ids);
              isShared = Array.isArray(parsed) && parsed.some(id => Number(id) === userId);
            } catch (e) {
              // Not a valid JSON string, treat as not shared
            }
          }
        }
        
        const hasAccess = isOwner || isShared;

        if (!hasAccess) {
          logger.warn(`Access denied: User ${userId} trying to access canvas ${canvasId}. Owner: ${ownerId}, Shared IDs: ${JSON.stringify(canvas.shared_with_ids)}, IsOwner: ${isOwner}, IsShared: ${isShared}`);
          socket.emit('error', { message: 'Access denied to canvas' });
          return;
        }
        
        logger.info(`Access granted: User ${userId} accessing canvas ${canvasId} (Owner: ${isOwner}, Shared: ${isShared})`);

        // Check if canvas has an active live session
        const isLive = liveSessionService.isLive(canvasId);
        
        if (!isLive) {
          socket.emit('error', { message: 'No active live session for this canvas' });
          return;
        }

        // Store canvasId in socket data
        socket.currentCanvasId = canvasId;

        // Join live session room (socket.io room = `live:${canvasId}`)
        socket.join(`live:${canvasId}`);
        
        // Add participant to live session service
        liveSessionService.addParticipant(canvasId, socket.userId);
        
        // Get room info for logging
        const room = socket.nsp.adapter.rooms.get(`live:${canvasId}`);
        const roomSize = room ? room.size : 0;
        
        logger.info(`✅ User ${socket.userId} joined live session for canvas:${canvasId} (Room size: ${roomSize})`);
        
        // Send confirmation
        socket.emit('joined-canvas', { canvasId, isLive: true });
        
        // Notify other participants (optional - for showing who's online)
        socket.to(`live:${canvasId}`).emit('user-joined', { 
          userId: socket.userId,
          canvasId 
        });
      } catch (error) {
        logger.error(error, `Error joining canvas room: ${canvasId}`);
        socket.emit('error', { message: 'Failed to join canvas' });
      }
    });

    // Leave canvas room
    socket.on('leave-canvas', (canvasId) => {
      if (canvasId) {
        socket.leave(`live:${canvasId}`);
        liveSessionService.removeParticipant(canvasId, socket.userId);
        logger.info(`User ${socket.userId} left live session for canvas:${canvasId}`);
        
        // Notify other participants
        socket.to(`live:${canvasId}`).emit('user-left', { 
          userId: socket.userId,
          canvasId 
        });
      }
      socket.currentCanvasId = null;
    });

    // Handle element updates (broadcast to live session participants)
    socket.on('element-update', (change) => {
      try {
        // Validate change object
        if (!change || !change.elementId || !change.type) {
          logger.warn('Invalid change object received', change);
          return;
        }

        // Get canvasId from socket data
        const canvasId = socket.currentCanvasId;
        
        if (!canvasId) {
          logger.warn('Element update received but no canvas room joined');
          return;
        }

        // Verify canvas has active live session
        if (!liveSessionService.isLive(canvasId)) {
          logger.warn(`Element update received but canvas ${canvasId} is not live`);
          return;
        }

        // Security: Override userId (prevent spoofing)
        change.userId = socket.userId;
        change.timestamp = change.timestamp || Date.now();

        // Get the room to check how many clients are in it
        const room = socket.nsp.adapter.rooms.get(`live:${canvasId}`);
        const roomSize = room ? room.size : 0;
        
        logger.info(`📡 Broadcasting element-update for canvas:${canvasId}`, {
          elementId: change.elementId,
          type: change.type,
          userId: socket.userId,
          roomSize: roomSize,
          senderInRoom: room?.has(socket.id) || false
        });

        // Broadcast to live session room (excluding sender)
        // This is the key: socket.to() excludes the sender
        socket.to(`live:${canvasId}`).emit('element-update', change);
        
        logger.debug(`✅ Element update broadcasted to ${roomSize - 1} participants (excluding sender)`);
      } catch (error) {
        logger.error(error, 'Error handling element-update');
        socket.emit('error', { message: 'Failed to process element update' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const canvasId = socket.currentCanvasId;
      
      if (canvasId) {
        // Remove from live session
        liveSessionService.removeParticipant(canvasId, socket.userId);
        
        // Notify other participants
        socket.to(`live:${canvasId}`).emit('user-left', { 
          userId: socket.userId,
          canvasId 
        });
      }
      
      logger.info(`Socket disconnected: ${socket.id} (User: ${socket.userId}, Reason: ${reason})`);
      // Socket.io automatically removes socket from all rooms on disconnect
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(error, `Socket error for ${socket.id}`);
    });
  });

  return io;
};
