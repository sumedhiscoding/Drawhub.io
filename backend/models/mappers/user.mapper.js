export const mapUserRow = (row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    password: row.password,
});

export default mapUserRow;