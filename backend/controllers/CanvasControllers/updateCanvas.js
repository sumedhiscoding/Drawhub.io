import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { updateCanvasQuery, findCanvasByIdQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';
import { NotFoundError } from 'slonik';

export const updateCanvas = async (id, owner_id, updateData) => {
    try {
        const pool = await connectDatabase();
        const existingCanvas = await pool.one(findCanvasByIdQuery(id));
        if (!existingCanvas) {
            throw new Error('Canvas not found');
        }
        if (existingCanvas.owner_id !== owner_id) {
            throw new Error('You do not have permission to update this canvas');
        }
        const canvas = await pool.one(updateCanvasQuery({ id, ...updateData }));
        return mapCanvasRow(canvas);
    } catch (error) {
        logger.error(error, "Error updating canvas");
        throw error;
    }
};

