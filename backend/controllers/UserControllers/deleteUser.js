import { one } from '../../config/db.js';
import logger from '../../config/logger.js';
import { deleteUser } from '../../models/queries/user.queries.js';

const deleteUserController = async (id) => {
    try {
        const result = await one(deleteUser(id));
        return result;
    } catch (error) {
        logger.error(error, "Error deleting user");
        throw error;
    }
};

export default deleteUserController;
