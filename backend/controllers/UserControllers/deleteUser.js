import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { deleteUser } from '../../models/queries/user.queries.js';

const deleteUserController = async (id) => {
    try {
        const pool = await connectDatabase();
        const result = await pool.one(deleteUser(id));
        return result;
    } catch (error) {
        logger.error(error, "Error deleting user");
        throw error;
    }
};

export default deleteUserController;

