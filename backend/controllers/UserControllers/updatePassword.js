import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { updateUserPassword, findUserById } from '../../models/queries/user.queries.js';
import { hashPassword } from '../../utils/hashing.js';
import bcrypt from 'bcrypt';
import { mapUserRow } from '../../models/mappers/user.mapper.js';

const updatePassword = async (id, oldPassword, newPassword) => {
    try {
        const pool = await connectDatabase();
        const user = await pool.one(findUserById(id));
        const mappedUser = mapUserRow(user);
        
        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, mappedUser.password);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        
        // Hash new password
        const hashedPassword = await hashPassword(newPassword);
        
        // Update password
        const updatedUser = await pool.one(updateUserPassword({ id, password: hashedPassword }));
        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    } catch (error) {
        logger.error(error, "Error updating password");
        throw error;
    }
};

export default updatePassword;

