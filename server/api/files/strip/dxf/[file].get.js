import { connectDB, getStripUserDxfBucket } from "~~/server/db/mongo";
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

  const db = await connectDB();
  const fileRecord = await db
    .collection("strip_user_dxf_files")
    .findOne({ slug: fileName });

  if (!fileRecord) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  if (fileRecord.ownerId !== userId && event.context.auth.isAdmin !== true) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const stripUserDxfFiles = await getStripUserDxfBucket();
  const readStream = stripUserDxfFiles.openDownloadStreamByName(fileName);

  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
