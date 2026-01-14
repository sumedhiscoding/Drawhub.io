import logger from '../../config/logger.js';

/**
 * User-related socket event handlers
 */
export const registerUserHandlers = (socket) => {
  // Handle user authentication/identification
  socket.on('user:identify', (userData) => {
    socket.userId = userData.userId;
    socket.userName = userData.userName;
    logger.info(`User identified: ${userData.userName} (${socket.id})`);
    
    // Acknowledge identification
    socket.emit('user:identified', {
      socketId: socket.id,
      userId: userData.userId
    });
  });

  // Handle user presence updates
  socket.on('user:presence-update', (data) => {
    const { canvasId, status } = data; // status: 'active', 'idle', 'away'
    
    if (canvasId) {
      socket.to(`canvas:${canvasId}`).emit('user:presence-update', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        status
      });
    }
  });

  // Handle typing indicators (if needed for chat features)
  socket.on('user:typing', (data) => {
    const { canvasId, isTyping } = data;
    
    if (canvasId) {
      socket.to(`canvas:${canvasId}`).emit('user:typing', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        isTyping
      });
    }
  });
};
