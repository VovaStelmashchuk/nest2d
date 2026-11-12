import { defineEventHandler } from "h3";
import { getDb } from "~~/server/db/postgres";
import logger from "~~/server/utils/logger";

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const nestSlug = getRouterParam(event, "slug");

    const sql = await getDb();
    await sql`
        UPDATE nesting_jobs SET email_notify = 'need_notify'
        WHERE slug = ${nestSlug} AND owner_id = ${userId}
    `;

    logger.info(`Updated email notification setting for nest ${nestSlug} to need_notify`);
});
