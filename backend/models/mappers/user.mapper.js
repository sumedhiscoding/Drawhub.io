export const mapUserRow = (row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    password: row.password,
});

export const mapUserRowWithoutPassword = (row) => {
    const { password, ...user } = mapUserRow(row);
    return user;
};

export default mapUserRow;