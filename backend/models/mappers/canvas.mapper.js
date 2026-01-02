/**
 * Maps a database row to a canvas object
 * @param {Object} row - Database row from canvas table
 * @returns {Object} Mapped canvas object
 * Note: elements is JSONB and will be automatically parsed as a JavaScript array/object by PostgreSQL
 */
export const mapCanvasRow = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    owner_id: row.owner_id,
    shared_with_ids: row.shared_with_ids, // PostgreSQL integer array
    elements: row.elements, // JSONB - can be array of objects, automatically parsed
    background_color: row.background_color,
    background_image_url: row.background_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
