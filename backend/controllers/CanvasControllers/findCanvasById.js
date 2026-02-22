import { one, NotFoundError } from '../../config/db.js';
import logger from '../../config/logger.js';
import { findCanvasByIdQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const findCanvasById = async (id) => {
    try {
        const canvas = await one(findCanvasByIdQuery(id));
        return mapCanvasRow(canvas);
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return null;
        }
        logger.error(error, "Error finding canvas by id");
        throw error;
    }
};
