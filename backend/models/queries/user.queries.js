import { sql } from 'slonik';

export const findUserById = (id) => sql.unsafe`
  SELECT id, email, name, password, created_at, updated_at
  FROM users
  WHERE id = ${id}
`;

export const createUser = ({ email, name, password }) => sql.unsafe`
  INSERT INTO users (email, name, password, created_at, updated_at)
  VALUES (${email}, ${name}, ${password}, now(), now())
  RETURNING id, email, name, created_at, updated_at
`;

export const findUserByEmail = (email) => sql.unsafe`
  SELECT id, email, name, password, created_at, updated_at
  FROM users
  WHERE email = ${email}
`;

export const findUsersByIds = (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return sql.unsafe`SELECT id, email, name, created_at, updated_at FROM users WHERE false`;
  }
  return sql.unsafe`
    SELECT id, email, name, created_at, updated_at
    FROM users
    WHERE id = ANY(${sql.array(userIds, 'int4')})
  `;
};

export const updateUser = ({ id, email, name }) => {
  const updates = [];
  if (email !== undefined) updates.push(sql.unsafe`email = ${email}`);
  if (name !== undefined) updates.push(sql.unsafe`name = ${name}`);
  updates.push(sql.unsafe`updated_at = now()`);
  
  return sql.unsafe`
    UPDATE users
    SET ${sql.join(updates, sql.unsafe`, `)}
    WHERE id = ${id}
    RETURNING id, email, name, created_at, updated_at
  `;
};

export const getAllUsers = (from = 0, to = 10, orderBy = 'name', order = 'ASC') => sql.unsafe`
  SELECT id, email, name, created_at, updated_at
  FROM users
  ORDER BY ${sql.identifier([orderBy])} ${sql.raw(order)}
  LIMIT ${to - from}
  OFFSET ${from}
`;

export const updateUserPassword = ({ id, password }) => sql.unsafe`
  UPDATE users
  SET password = ${password}, updated_at = now()
  WHERE id = ${id}
  RETURNING id, email, name, updated_at
`;

export const deleteUser = (id) => sql.unsafe`
  DELETE FROM users
  WHERE id = ${id}
  RETURNING id
`;

export const countUsers = () => sql.unsafe`
  SELECT COUNT(*) as total
  FROM users
`;

export const searchUsers = (searchTerm, from = 0, to = 10) => sql.unsafe`
  SELECT id, email, name, created_at, updated_at
  FROM users
  WHERE name ILIKE ${'%' + searchTerm + '%'} OR email ILIKE ${'%' + searchTerm + '%'}
  ORDER BY name ASC
  LIMIT ${to - from}
  OFFSET ${from}
`;
