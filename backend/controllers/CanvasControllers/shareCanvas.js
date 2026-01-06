import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findCanvasByIdQuery, updateCanvasQuery } from '../../models/queries/canvas.queries.js';
import { findUserByEmail } from '../../models/queries/user.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';
import { NotFoundError } from 'slonik';

export const shareCanvas = async (canvasId, ownerId, email) => {
    try {
        const pool = await connectDatabase();
        
        // Find the canvas
        const canvas = await pool.one(findCanvasByIdQuery(canvasId));
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        // Check if user is the owner
        if (canvas.owner_id !== ownerId) {
            throw new Error('You do not have permission to share this canvas');
        }
        
        // Find user by email
        const userToShare = await pool.maybeOne(findUserByEmail(email));
        if (!userToShare) {
            throw new Error('User with this email not found');
        }
        
        // Check if trying to share with owner
        if (userToShare.id === ownerId) {
            throw new Error('Cannot share canvas with yourself');
        }
        
        // Get current shared_with_ids array
        const currentSharedIds = canvas.shared_with_ids || [];
        
        // Check if user is already shared
        if (currentSharedIds.includes(userToShare.id)) {
            throw new Error('Canvas is already shared with this user');
        }
        
        // Add user ID to shared_with_ids array
        const updatedSharedIds = [...currentSharedIds, userToShare.id];
        
        // Update canvas with new shared_with_ids
        const updatedCanvas = await pool.one(updateCanvasQuery({
            id: canvasId,
            shared_with_ids: updatedSharedIds
        }));
        
        const mappedCanvas = mapCanvasRow(updatedCanvas);
        const mappedUser = mapUserRowWithoutPassword(userToShare);
        
        return {
            canvas: mappedCanvas,
            sharedUser: mappedUser
        };
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            throw new Error('Canvas or user not found');
        }
        logger.error(error, "Error sharing canvas");
        throw error;
    }
};

