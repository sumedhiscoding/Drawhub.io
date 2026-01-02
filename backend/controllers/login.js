import connectDatabase from '../config/db.js';
import logger from '../config/logger.js';
import { sql } from 'slonik';
import bcrypt from 'bcrypt';

const loginUser = async (email, password) => {
    try {
        const pool = await connectDatabase();
        const users = await pool.any(sql.unsafe`
            SELECT * FROM users WHERE email = ${email}
        `);
        
        if (users.length === 0) {
            return null; // User not found
        }
        
        const user = users[0];
        
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return null; // Invalid password
        }
        
        // Remove password from user object before returning
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        logger.error(error, "Error during login");
        throw error;
    }
};

export default loginUser;

