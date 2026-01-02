import { sql } from 'slonik';

export const createCanvasQuery = ({ name, description, owner_id, shared_with_ids, elements, background_color, background_image_url }) => {
    const sharedIds = Array.isArray(shared_with_ids) && shared_with_ids.length > 0 
        ? sql.array(shared_with_ids, 'int4') 
        : sql.array([], 'int4');
    const elementsJson = elements ? sql.jsonb(elements) : sql.jsonb([]);
    
    return sql.unsafe`
        INSERT INTO canvas (name, description, owner_id, shared_with_ids, elements, background_color, background_image_url)
        VALUES (${name}, ${description}, ${owner_id}, ${sharedIds}, ${elementsJson}, ${background_color || '#ffffff'}, ${background_image_url || null})
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