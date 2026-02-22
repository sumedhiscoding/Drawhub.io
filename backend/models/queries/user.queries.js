import { sql } from "drizzle-orm";

const intArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return sql`ARRAY[]::int4[]`;
  }
  return sql`ARRAY[${sql.join(arr.map(v => sql`${v}`), sql`, `)}]::int4[]`;
};

export const findUserById = (id) => sql`
  SELECT id, email, name, password, created_at, updated_at
  FROM users
  WHERE id = ${id}
`;

export const createUser = ({ email, name, password }) => sql`
  INSERT INTO users (email, name, password, created_at, updated_at)
  VALUES (${email}, ${name}, ${password}, now(), now())
  RETURNING id, email, name, created_at, updated_at
`;

export const findUserByEmail = (email) => sql`
  SELECT id, email, name, password, created_at, updated_at
  FROM users
  WHERE email = ${email}
`;

export const findUsersByIds = (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return sql`SELECT id, email, name, created_at, updated_at FROM users WHERE false`;
  }
  return sql`
    SELECT id, email, name, created_at, updated_at
    FROM users
    WHERE id = ANY(${intArray(userIds)})
  `;
};

export const updateUser = ({ id, email, name }) => {
  const updates = [];
  if (email !== undefined) updates.push(sql`email = ${email}`);
  if (name !== undefined) updates.push(sql`name = ${name}`);
  updates.push(sql`updated_at = now()`);

  return sql`
    UPDATE users
    SET ${sql.join(updates, sql`, `)}
    WHERE id = ${id}
    RETURNING id, email, name, created_at, updated_at
  `;
};

export const getAllUsers = (
  from = 0,
  to = 10,
  orderBy = "name",
  order = "ASC",
) => sql`
  SELECT id, email, name, created_at, updated_at
  FROM users
  ORDER BY ${sql.identifier(orderBy)} ${sql.raw(order)}
  LIMIT ${to - from}
  OFFSET ${from}
`;

export const updateUserPassword = ({ id, password }) => sql`
  UPDATE users
  SET password = ${password}, updated_at = now()
  WHERE id = ${id}
  RETURNING id, email, name, updated_at
`;

export const deleteUser = (id) => sql`
  DELETE FROM users
  WHERE id = ${id}
  RETURNING id
`;

export const countUsers = () => sql`
  SELECT COUNT(*) as total
  FROM users
`;

export const searchUsers = (searchTerm, from = 0, to = 10) => sql`
  SELECT id, email, name, created_at, updated_at
  FROM users
  WHERE name ILIKE ${"%" + searchTerm + "%"} OR email ILIKE ${"%" + searchTerm + "%"}
  ORDER BY name ASC
  LIMIT ${to - from}
  OFFSET ${from}
`;

export const deleteAllUsers = () => sql`
  DELETE FROM users
  RETURNING id, email, name
`;
