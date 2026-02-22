import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import logger from "./logger.js";

let pool = null;
let db = null;

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

const connectDatabase = async () => {
  if (!db) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool);
    logger.info("Database connection established successfully.");
  }
  return db;
};

export const one = async (query) => {
  const database = await connectDatabase();
  const result = await database.execute(query);
  if (result.rows.length === 0) {
    throw new NotFoundError();
  }
  if (result.rows.length > 1) {
    throw new Error("Expected exactly one row, but got multiple");
  }
  return result.rows[0];
};

export const any = async (query) => {
  const database = await connectDatabase();
  const result = await database.execute(query);
  return result.rows;
};

export const maybeOne = async (query) => {
  const database = await connectDatabase();
  const result = await database.execute(query);
  if (result.rows.length === 0) {
    return null;
  }
  if (result.rows.length > 1) {
    throw new Error("Expected at most one row, but got multiple");
  }
  return result.rows[0];
};

export const execute = async (query) => {
  const database = await connectDatabase();
  return database.execute(query);
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
};

export default connectDatabase;
