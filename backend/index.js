import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import connectDatabase from './config/db.js';
import auth from './routes/authRoutes.js';
import './utils/passport.js'; // Initialize passport strategies
import pinoHttp from "pino-http";
import logger from './config/logger.js';



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());


app.use(pinoHttp({ logger }));


connectDatabase().then(() => {  
  logger.info("Database connection established successfully.");
}).catch((err) => {
  logger.error(err, "Failed to create pool");
  process.exit(1);
});


app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/auth',auth);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server is running on port 3000');
});



