import { any } from '../../config/db.js';
import logger from '../../config/logger.js';
import { findAllCanvasesByOwnerIdQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const findAllCanvasesByOwnerId = async (owner_id) => {
    try {
        const canvases = await any(findAllCanvasesByOwnerIdQuery(owner_id));
        return canvases.map(mapCanvasRow);
    } catch (error) {
        logger.error(error, "Error finding canvases by owner id");
        throw error;
    }
};
