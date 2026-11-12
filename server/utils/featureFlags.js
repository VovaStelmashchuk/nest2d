import { createError } from "h3";
import { getDb } from "~~/server/db/postgres";

/**
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isStripFeatureEnabled(userId) {
  const sql = await getDb();
  const [user] = await sql`
    SELECT is_strip_feature_enable FROM users WHERE id = ${userId}
  `;
  return Boolean(user?.isStripFeatureEnable);
}

/**
 * Throws 403 if the strip feature is not enabled for the user.
 * @param {string} userId
 */
export async function assertStripFeatureEnabled(userId) {
  const enabled = await isStripFeatureEnabled(userId);
  if (!enabled) {
    throw createError({
      statusCode: 403,
      message: "Strip feature is not enabled for this user.",
    });
  }
}
