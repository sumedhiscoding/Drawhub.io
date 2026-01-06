import connectDatabase from '../../config/db.js';
import logger from '../../config/logger.js';
import { deleteCanvasQuery } from '../../models/queries/canvas.queries.js';
import { NotFoundError } from 'slonik';
import { mapCanvasRow } from '../../models/mappers/canvas.mapper.js';
import { findCanvasById } from './findCanvasById.js';

export const deleteCanvas=async(id, owner_id)=>{
   
    try {
        const pool = await connectDatabase();
        if(!id || !owner_id){
            throw new Error("Id and owner_id are required");
        }
        const found = await findCanvasById(id);
        if(!found){
            throw new Error("Canvas not found");
        }
        if(found.owner_id !== owner_id){
            throw new Error("You are not the owner of this canvas");
        }
        const canvas = await pool.one(deleteCanvasQuery(id, owner_id));
        return mapCanvasRow(canvas);
    } catch (error) {
        if (error instanceof NotFoundError || error.code === 'ERR_UNHANDLED_ERROR' || error.message?.includes('no rows')) {
            return null;
        }
        logger.error(error, "Error deleting canvas");
        return null;
    }
}