import { any } from '../../config/db.js';
import logger from '../../config/logger.js';
import { findAllCanvasesQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const findAllCanvases = async () => {
    try {
        const canvases = await any(findAllCanvasesQuery());
        return canvases.map(mapCanvasRow);
    } catch (error) {
        logger.error(error, "Error finding all canvases");
        throw error;
    }
};
