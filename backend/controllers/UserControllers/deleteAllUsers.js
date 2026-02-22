import { any } from '../../config/db.js';
import logger from '../../config/logger.js';
import { deleteAllUsers } from '../../models/queries/user.queries.js';

const deleteAllUsersController = async () => {
    try {
        const result = await any(deleteAllUsers());
        return result;
    } catch (error) {
        logger.error(error, "Error deleting all users");
        throw error;
    }
};

export default deleteAllUsersController;
