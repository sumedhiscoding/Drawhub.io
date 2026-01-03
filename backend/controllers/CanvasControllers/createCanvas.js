import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { createCanvasQuery } from '../../models/queries/canvas.queries.js';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';

export const createCanvas = async (name, owner_id, options = {}) => {
    try {
        const pool = await connectDatabase();
        const canvas = await pool.one(createCanvasQuery({ 
            name, 
            owner_id,
            description: options.description,
            shared_with_ids: options.shared_with_ids,
            elements: options.elements,
            background_color: options.background_color,
            background_image_url: options.background_image_url
        }));
        if (!canvas) {
            throw new Error("Failed to create canvas in database");
        }
        return mapCanvasRow(canvas);
    } catch (error) {
        logger.error(error, "Error creating canvas");
        throw error;
    }
};