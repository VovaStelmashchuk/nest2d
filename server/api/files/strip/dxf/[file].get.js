import { BUCKET, getFile } from "~~/server/db/files";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  await assertStripFeatureEnabled(userId);

  const fileName = getRouterParam(event, "file");

  const file = await getFile(BUCKET.STRIP_USER_DXF, fileName);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  if (file.ownerId !== userId && event.context.auth.isAdmin !== true) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return file.data;
});
