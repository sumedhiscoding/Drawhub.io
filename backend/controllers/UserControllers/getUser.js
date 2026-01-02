import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findUserById } from '../../models/queries/user.queries.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';

const getUser = async (id) => {
    try {
        const pool = await connectDatabase();
        const user = await pool.one(findUserById(id));
        return mapUserRowWithoutPassword(user);
    } catch (error) {
        logger.error(error, "Error getting user");
        return null;
    }
};

export default getUser;

