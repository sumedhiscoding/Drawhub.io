import dotenv from 'dotenv';
import connectDatabase from './config/db.js';
import logger from './config/logger.js';
import app from './app.js';

dotenv.config();

// Connect to database
connectDatabase().then(() => {  
  logger.info("Database connection established successfully.");
}).catch((err) => {
  logger.error(err, "Failed to create pool");
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
