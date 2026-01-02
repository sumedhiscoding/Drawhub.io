import { sql } from 'slonik';

export const findUserById = (id) => sql.unsafe`
  SELECT id, email, name
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

export const updateUser = ({ id, email, name }) => sql.unsafe`
  UPDATE users
  SET email = ${email}, name = ${name}, updated_at = now()
  WHERE id = ${id}
  RETURNING id, email, name, updated_at
`;

export const deleteUser = (id) => sql.unsafe`
  DELETE FROM users
  WHERE id = ${id}
`;

export const getAllUsers = (from = 0, to = 10 , orderBy = 'name', order = 'ASC') => sql.unsafe`
  SELECT id, email, name
  FROM users
  ORDER BY ${orderBy} ${order}
  LIMIT ${to - from}
  OFFSET ${from}
`;


