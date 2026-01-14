import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDatabase from './config/db.js';
import logger from './config/logger.js';
import app from './app.js';
import { initializeSocket } from './socket/index.js';

dotenv.config();

// Connect to database
connectDatabase().then(() => {  
  logger.info("Database connection established successfully.");
}).catch((err) => {
  logger.error(err, "Failed to create pool");
  process.exit(1);
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Export io instance for use in other files
export { io };

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Socket.io server is ready`);
});