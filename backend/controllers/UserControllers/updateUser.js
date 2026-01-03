import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { updateUser, findUserByEmail } from '../../models/queries/user.queries.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';

const updateUserController = async (id, { name, email }) => {
    try {
        const pool = await connectDatabase();
        
        // Check if email is being changed and if it's already taken by another user
        if (email !== undefined) {
            const existingUser = await pool.maybeOne(findUserByEmail(email));
            if (existingUser && existingUser.id !== parseInt(id)) {
                throw new Error('Email already in use');
            }
        }
        
        const user = await pool.one(updateUser({ id, name, email }));
        return mapUserRowWithoutPassword(user);
    } catch (error) {
        logger.error(error, "Error updating user");
        throw error;
    }
};

export default updateUserController;

