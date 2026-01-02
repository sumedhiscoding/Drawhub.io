import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { findAllCanvasesBySharedWithIdsQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const findAllCanvasesBySharedWithIds = async (user_id) => {
    try {
        const pool = await connectDatabase();
        const canvases = await pool.many(findAllCanvasesBySharedWithIdsQuery(user_id));
        if(!canvases){
            throw new Error("No canvases found");
        }
        // Return empty array if no canvases found, or map each canvas
        return canvases.map(mapCanvasRow);
    } catch (error) {
        logger.error(error, "Error finding canvases by shared with ids");
        throw error;
    }
};

