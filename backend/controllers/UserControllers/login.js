import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import bcrypt from 'bcrypt';
import { findUserByEmail } from '../../models/queries/user.queries.js';
import mapUserRow from '../../models/mappers/user.mapper.js';
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
        logger.error(error, "Error during login");
        throw error;
    }
};

export default loginUser;

