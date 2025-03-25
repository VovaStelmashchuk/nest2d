import { connectDB, getDxfResultBucket } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const slug = getRouterParam(event, "slug");

  const db = await connectDB();

  const nestResult = await db
    .collection("nesting_jobs")
    .findOne({ slug: slug, ownerId: userId });

  const dxfFileName = nestResult.dxf_file;

  const nestDxfBucket = await getDxfResultBucket();

  const readStream = nestDxfBucket.openDownloadStreamByName(dxfFileName);

  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="${slug}.dxf"`,
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
