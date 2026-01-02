import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { createUser } from '../../models/queries/user.queries.js';
import mapUserRow from '../../models/mappers/user.mapper.js';

const registerUser = async (name, email, hashedPassword) => {
    try {
        const pool = await connectDatabase();
        const user = await pool.one(createUser({ name, email, password: hashedPassword }));
        if(!user){
            throw new Error("Failed to create user in database");
        }
        return mapUserRow(user);
    } catch (error) {
        logger.error(error, "Error creating user in database");
        return null;
    }
};

export default registerUser;