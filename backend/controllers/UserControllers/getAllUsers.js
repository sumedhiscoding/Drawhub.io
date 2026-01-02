import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { getAllUsers, countUsers } from '../../models/queries/user.queries.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';

const getAllUsersController = async (from = 0, to = 10, orderBy = 'name', order = 'ASC') => {
    try {
        const pool = await connectDatabase();
        const users = await pool.any(getAllUsers(from, to, orderBy, order));
        const totalResult = await pool.one(countUsers());
        const total = parseInt(totalResult.total);
        
        return {
            users: users.map(mapUserRowWithoutPassword),
            pagination: {
                from,
                to,
                total,
                hasMore: to < total
            }
        };
    } catch (error) {
        logger.error(error, "Error getting all users");
        throw error;
    }
};

export default getAllUsersController;

