import { connectDB, getStripNestDxfBucket } from "~~/server/db/mongo";
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
  const job = await db
    .collection("strip_nesting_job_queue")
    .findOne({ dxf_files: fileName });

  if (!job) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  if (job.ownerId !== userId && event.context.auth.isAdmin !== true) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const stripNestDxfBucket = await getStripNestDxfBucket();
  const readStream = stripNestDxfBucket.openDownloadStreamByName(fileName);

  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
