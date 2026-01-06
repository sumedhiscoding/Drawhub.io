import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findUsersByIds } from '../../models/queries/user.queries.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';
import { NotFoundError } from 'slonik';

export const getSharedUsers = async (userIds) => {
    try {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return [];
        }
        
        const pool = await connectDatabase();
        const users = await pool.any(findUsersByIds(userIds));
        return users.map(mapUserRowWithoutPassword);
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return [];
        }
        logger.error(error, "Error getting shared users");
        throw error;
    }
};

