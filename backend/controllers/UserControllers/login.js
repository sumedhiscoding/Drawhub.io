import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../../models/queries/user.queries.js';
import mapUserRow from '../../models/mappers/user.mapper.js';
import { NotFoundError } from 'slonik';

const loginUser = async (email, password) => {
    try {
        logger.info(`Logging in user: ${email}, ${password}`);
        const pool = await connectDatabase();
        const user = await pool.one(findUserByEmail(email));
        const mappedUser = mapUserRow(user);
        if (!mappedUser) {
            logger.error(`User not found: ${email}`);
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, mappedUser.password);
        if (!isPasswordValid) {
            return null; 
        }
        const { password: _, ...userWithoutPassword } = mappedUser;
        return userWithoutPassword;
    } catch (error) {
        // Handle case where user doesn't exist
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return null;
        }
        logger.error(error, "Error during login");
        throw error;
    }
};

export default loginUser;

