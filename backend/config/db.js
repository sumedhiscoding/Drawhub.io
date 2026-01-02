import { createPool } from 'slonik';
import logger from './logger.js';

let pool = null;

const connectDatabase = async () => {
    if (!pool) {
        pool = await createPool(process.env.DATABASE_URL);
        logger.info("Pool created successfully.");
    }
    return pool;
};

export default connectDatabase;