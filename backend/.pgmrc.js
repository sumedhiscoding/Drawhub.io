export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: './migrations',
  migrationsTable: 'pgmigrations',
  type: 'esm'
};

