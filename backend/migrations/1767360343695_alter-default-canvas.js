/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
       // Set defaults using ALTER TABLE
       pgm.sql(`ALTER TABLE canvas ALTER COLUMN shared_with_ids SET DEFAULT '{}'::integer[]`);
       pgm.sql(`ALTER TABLE canvas ALTER COLUMN elements SET DEFAULT '[]'::jsonb`);
       pgm.sql(`ALTER TABLE canvas ALTER COLUMN background_color SET DEFAULT '#ffffff'`);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};
