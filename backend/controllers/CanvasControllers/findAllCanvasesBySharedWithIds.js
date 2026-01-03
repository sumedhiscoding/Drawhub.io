import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findAllCanvasesBySharedWithIdsQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';
import { NotFoundError } from 'slonik';

export const findAllCanvasesBySharedWithIds = async (user_id) => {
    try {
        const pool = await connectDatabase();
        const canvases = await pool.any(findAllCanvasesBySharedWithIdsQuery(user_id));
        // Return empty array if no canvases found, or map each canvas
        return canvases.map(mapCanvasRow);
    } catch (error) {
        // pool.any() should return empty array, but handle edge cases
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return [];
        }
        logger.error(error, "Error finding canvases by shared with ids");
        throw error;
    }
};

