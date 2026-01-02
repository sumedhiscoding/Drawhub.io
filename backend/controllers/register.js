import connectDatabase from '../config/db.js';
import logger from '../config/logger.js';
import { sql } from 'slonik';

const createUserInDatabase = async (name, email, hashedPassword) => {
    try {
        const pool = await connectDatabase();
        const user = await pool.any(sql.unsafe`
            INSERT INTO "Users" (name, email, password)
            VALUES (${name}, ${email}, ${hashedPassword})
            RETURNING *
        `);
        return user;
    } catch (error) {
        logger.error(error, "Error creating user in database");
        throw error;
    }
};

export default createUserInDatabase;