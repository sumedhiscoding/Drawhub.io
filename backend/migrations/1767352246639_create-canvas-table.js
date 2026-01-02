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
    pgm.createTable('canvas', {
        id: 'id',
        name: { type: 'varchar(255)', notNull: true },
        description: { type: 'text' },
        owner_id: { 
            type: 'integer', 
            notNull: true, 
            references: 'users(id)',
            onDelete: 'CASCADE'
        },
        shared_with_ids: { 
            type: 'integer[]', 
            notNull: false,
            default: '{}'
        },
        elements: { 
            type: 'jsonb', 
            notNull: false,
            default: '[]'
        },
        background_color: { 
            type: 'varchar(255)', 
            notNull: false, 
            default: '#ffffff' 
        },
        background_image_url: { 
            type: 'varchar(255)', 
            notNull: false 
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('canvas');
};
