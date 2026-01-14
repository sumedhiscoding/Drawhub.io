import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findCanvasByIdQuery, updateCanvasQuery } from '../../models/queries/canvas.queries.js';
import { findUserById } from '../../models/queries/user.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';
import { mapUserRowWithoutPassword } from '../../models/mappers/user.mapper.js';
import { NotFoundError } from 'slonik';

export const removeAccess = async (canvasId, ownerId, userIdToRemove) => {
    try {
        const pool = await connectDatabase();
        
        // Find the canvas
        const canvas = await pool.one(findCanvasByIdQuery(canvasId));
        if (!canvas) {
            throw new Error('Canvas not found');
        }
        
        // Check if user is the owner
        if (canvas.owner_id !== ownerId) {
            throw new Error('You do not have permission to remove access from this canvas');
        }
        
        // Get current shared_with_ids array
        const currentSharedIds = canvas.shared_with_ids || [];
        
        // Check if user is in the shared list
        if (!currentSharedIds.includes(userIdToRemove)) {
            throw new Error('User does not have access to this canvas');
        }
        
        // Remove user ID from shared_with_ids array
        const updatedSharedIds = currentSharedIds.filter(id => id !== userIdToRemove);
        
        // Update canvas with new shared_with_ids
        const updatedCanvas = await pool.one(updateCanvasQuery({
            id: canvasId,
            shared_with_ids: updatedSharedIds
        }));
        
        // Get user info for response
        const removedUser = await pool.maybeOne(findUserById(userIdToRemove));
        
        const mappedCanvas = mapCanvasRow(updatedCanvas);
        const mappedUser = removedUser ? mapUserRowWithoutPassword(removedUser) : null;
        
        return {
            canvas: mappedCanvas,
            removedUser: mappedUser
        };
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            throw new Error('Canvas or user not found');
        }
        logger.error(error, "Error removing access");
        throw error;
    }
};
