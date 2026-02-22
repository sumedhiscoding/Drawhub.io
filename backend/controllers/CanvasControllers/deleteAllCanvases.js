import { any } from '../../config/db.js';
import logger from '../../config/logger.js';
import { deleteAllCanvasesQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const deleteAllCanvases = async () => {
    try {
        const canvases = await any(deleteAllCanvasesQuery());
        return canvases.map(mapCanvasRow);
    } catch (error) {
        logger.error(error, "Error deleting all canvases");
        throw error;
    }
};
