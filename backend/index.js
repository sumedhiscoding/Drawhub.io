import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDatabase from './config/db.js';
import logger from './config/logger.js';
import app from './app.js';
import { initializeSocketServer } from './socket/socketServer.js';

dotenv.config();

// Create HTTP server (required for Socket.IO)
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(httpServer);

// Make io available to app if needed (optional)
app.set('io', io);

// Connect to database
connectDatabase().then(() => {  
  logger.info("Database connection established successfully.");
}).catch((err) => {
  logger.error(err, "Failed to create pool");
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Socket.IO server initialized`);
});
