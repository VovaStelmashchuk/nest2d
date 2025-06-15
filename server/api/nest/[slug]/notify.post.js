import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import logger from "~~/server/utils/logger";

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId;
    if (!userId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const db = await connectDB();
    const user = await db.collection("users").findOne({ id: userId });
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
        });
    }

    const nestSlug = getRouterParam(event, "slug");

    await db.collection("nesting_jobs").updateOne(
        {
            slug: nestSlug,
            ownerId: userId
        },
        {
            $set: {
                emailNotify: 'need_notify'
            }
        }
    );

    logger.info(`Updated email notification setting for nest ${nestSlug} to need_notify`);
});
