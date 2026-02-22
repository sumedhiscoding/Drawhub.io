import { sql } from "drizzle-orm";

const intArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return sql`ARRAY[]::int4[]`;
  }
  return sql`ARRAY[${sql.join(arr.map(v => sql`${v}`), sql`, `)}]::int4[]`;
};

const jsonb = (value) => {
  return sql`${JSON.stringify(value)}::jsonb`;
};

export const createCanvasQuery = ({
  name,
  owner_id,
  description,
  shared_with_ids,
  elements,
  background_color,
  background_image_url,
}) => {
  let sharedIds;
  if (
    shared_with_ids !== undefined &&
    shared_with_ids !== null &&
    Array.isArray(shared_with_ids)
  ) {
    sharedIds = intArray(shared_with_ids);
  } else {
    sharedIds = sql`ARRAY[]::int4[]`;
  }

  let canvasElements;
  if (elements !== undefined && elements !== null && Array.isArray(elements)) {
    canvasElements = jsonb(elements);
  } else {
    canvasElements = sql`'[]'::jsonb`;
  }

  const desc =
    description !== undefined && description !== null ? description : null;
  const bgColor =
    background_color !== undefined && background_color !== null
      ? background_color
      : "#ffffff";
  const bgImage =
    background_image_url !== undefined && background_image_url !== null
      ? background_image_url
      : null;

  return sql`
        INSERT INTO canvas (name, owner_id, description, shared_with_ids, elements, background_color, background_image_url)
        VALUES (${name}, ${owner_id}, ${desc}, ${sharedIds}, ${canvasElements}, ${bgColor}, ${bgImage})
        RETURNING id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    `;
};

export const updateCanvasQuery = ({
  id,
  name,
  description,
  shared_with_ids,
  elements,
  background_color,
  background_image_url,
}) => {
  const updates = [];
  if (name !== undefined) updates.push(sql`name = ${name}`);
  if (description !== undefined)
    updates.push(sql`description = ${description}`);
  if (shared_with_ids !== undefined) {
    const sharedIds = intArray(shared_with_ids);
    updates.push(sql`shared_with_ids = ${sharedIds}`);
  }
  if (elements !== undefined) {
    updates.push(sql`elements = ${jsonb(elements)}`);
  }
  if (background_color !== undefined)
    updates.push(sql`background_color = ${background_color}`);
  if (background_image_url !== undefined)
    updates.push(sql`background_image_url = ${background_image_url}`);
  updates.push(sql`updated_at = now()`);

  return sql`
        UPDATE canvas
        SET ${sql.join(updates, sql`, `)}
        WHERE id = ${id}
        RETURNING id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    `;
};

export const findCanvasByIdQuery = (id) => sql`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE id = ${id}
`;

export const findAllCanvasesQuery = () => sql`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    ORDER BY created_at DESC
`;

export const findAllCanvasesByOwnerIdQuery = (owner_id) => sql`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE owner_id = ${owner_id}
`;

export const findAllCanvasesBySharedWithIdsQuery = (user_id) => sql`
    SELECT id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
    FROM canvas
    WHERE ${user_id} = ANY(shared_with_ids)
`;

export const deleteCanvasQuery = (id, owner_id) => sql`
    DELETE FROM canvas
    WHERE id = ${id}
    AND owner_id = ${owner_id}
    RETURNING id, name, description, owner_id, shared_with_ids, elements, background_color, background_image_url, created_at, updated_at
`;
