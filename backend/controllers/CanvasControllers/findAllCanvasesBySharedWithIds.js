import { any, NotFoundError } from '../../config/db.js';
import logger from '../../config/logger.js';
import { findAllCanvasesBySharedWithIdsQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const findAllCanvasesBySharedWithIds = async (user_id) => {
    try {
        const canvases = await any(findAllCanvasesBySharedWithIdsQuery(user_id));
        return canvases.map(mapCanvasRow);
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return [];
        }
        logger.error(error, "Error finding canvases by shared with ids");
        throw error;
    }
};
