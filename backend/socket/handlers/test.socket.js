import { io } from '../../index.js';
import logger from '../../config/logger.js';

export const registerTestHandlers = (socket) => {
    socket.on('message', (data) => {
        logger.info('Received:', data);
        io.emit('message', data);  // Broadcast to all connected clients
    });
}