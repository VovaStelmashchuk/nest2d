import postgres from "postgres";
import logger from "../utils/logger";
import { migrations } from "./schema";

// Arbitrary constant: serializes schema migrations across app instances.
const MIGRATION_LOCK_ID = 727274001;

/** @type {Promise<import('postgres').Sql> | null} */
let ready = null;

/**
 * Returns the shared Postgres client, connecting and applying pending schema
 * migrations on first use. Column names are mapped snake_case <-> camelCase,
 * so rows come back as `{ ownerId, createdAt, ... }`.
 * @returns {Promise<import('postgres').Sql>}
 */
export function getDb() {
    if (!ready) {
        ready = init().catch((err) => {
            ready = null;
            throw err;
        });
    }
    return ready;
}

async function init() {
    const sql = postgres(useRuntimeConfig().databaseUrl, {
        max: 10,
        onnotice: () => {},
        transform: {
            undefined: null,
            column: { from: postgres.toCamel, to: postgres.fromCamel },
        },
    });

    try {
        await migrate(sql);
        logger.info("Connected to Postgres");
    } catch (err) {
        logger.error("Failed to connect to Postgres", err);
        await sql.end({ timeout: 5 });
        throw err;
    }
    return sql;
}

/**
 * @param {import('postgres').Sql} sql
 */
async function migrate(sql) {
    await sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_ID})`;
        await tx`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id         text PRIMARY KEY,
                applied_at timestamptz NOT NULL DEFAULT now()
            )
        `;
        const applied = new Set(
            (await tx`SELECT id FROM schema_migrations`).map((row) => row.id)
        );
        for (const migration of migrations) {
            if (applied.has(migration.id)) {
                continue;
            }
            await tx.unsafe(migration.sql);
            await tx`INSERT INTO schema_migrations (id) VALUES (${migration.id})`;
            logger.info(`Applied schema migration ${migration.id}`);
        }
    });
}
