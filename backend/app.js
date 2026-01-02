import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import './utils/passport.js'; // Initialize passport strategies
import pinoHttp from "pino-http";
import logger from './config/logger.js';

// Routes
import auth from './routes/authRoutes.js';
import canvasRoutes from './routes/canvasRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(pinoHttp({ logger }));

// Routes
app.use('/auth', auth);
app.use('/canvas', canvasRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(err, "Unhandled error");
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error' 
    });
});

export default app;

