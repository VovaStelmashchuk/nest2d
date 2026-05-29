import { createError } from "h3";
import { connectDB } from "~~/server/db/mongo";

/**
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isStripFeatureEnabled(userId) {
  const db = await connectDB();
  const user = await db
    .collection("users")
    .findOne({ id: userId }, { projection: { isStripFeatureEnable: 1 } });
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
