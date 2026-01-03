import { sql } from 'slonik';

export const createCanvasQuery = ({ name, owner_id, description, shared_with_ids, elements, background_color, background_image_url }) => {
    // Handle shared_with_ids: use provided array if valid, otherwise empty array
    let sharedIds;
    if (shared_with_ids !== undefined && shared_with_ids !== null && Array.isArray(shared_with_ids)) {
        sharedIds = shared_with_ids.length > 0 
            ? sql.array(shared_with_ids, 'int4')
            : sql.array([], 'int4');
    } else {
        sharedIds = sql.array([], 'int4');
    }
    
    // Handle elements: use provided array if valid, otherwise empty array
    let canvasElements;
    if (elements !== undefined && elements !== null && Array.isArray(elements)) {
        canvasElements = sql.jsonb(elements);
    } else {
        canvasElements = sql.jsonb([]);
    }
    
    const desc = description !== undefined && description !== null ? description : null;
    const bgColor = background_color !== undefined && background_color !== null ? background_color : '#ffffff';
    const bgImage = background_image_url !== undefined && background_image_url !== null ? background_image_url : null;
    
    return sql.unsafe`
        INSERT INTO canvas (name, owner_id, description, shared_with_ids, elements, background_color, background_image_url)
        VALUES (${name}, ${owner_id}, ${desc}, ${sharedIds}, ${canvasElements}, ${bgColor}, ${bgImage})
        RETURNING id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    `;
};

export const updateCanvasQuery = ({ id, name, description, shared_with_ids, elements, background_color, background_image_url }) => {
    const updates = [];
    if (name !== undefined) updates.push(sql.unsafe`name = ${name}`);
    if (description !== undefined) updates.push(sql.unsafe`description = ${description}`);
    if (shared_with_ids !== undefined) {
        const sharedIds = Array.isArray(shared_with_ids) && shared_with_ids.length > 0 
            ? sql.array(shared_with_ids, 'int4') 
            : sql.array([], 'int4');
        updates.push(sql.unsafe`shared_with_ids = ${sharedIds}`);
    }
    if (elements !== undefined) {
        updates.push(sql.unsafe`elements = ${sql.jsonb(elements)}`);
    }
    if (background_color !== undefined) updates.push(sql.unsafe`background_color = ${background_color}`);
    if (background_image_url !== undefined) updates.push(sql.unsafe`background_image_url = ${background_image_url}`);
    updates.push(sql.unsafe`updated_at = now()`);
    
    return sql.unsafe`
        UPDATE canvas
        SET ${sql.join(updates, sql.unsafe`, `)}
        WHERE id = ${id}
        RETURNING id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    `;
};


export const findCanvasByIdQuery = (id) => sql.unsafe`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE id = ${id}
`;

export const findAllCanvasesQuery = () => sql.unsafe`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    ORDER BY created_at DESC
`;

export const findAllCanvasesByOwnerIdQuery = (owner_id) => sql.unsafe`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE owner_id = ${owner_id}
`;

export const findAllCanvasesBySharedWithIdsQuery = (user_id) => sql.unsafe`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE ${user_id} = ANY(shared_with_ids)
`;