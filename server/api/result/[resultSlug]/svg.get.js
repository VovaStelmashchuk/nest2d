import { connectDB, getSvgResultBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const resultSlug = getRouterParam(event, "resultSlug");

  const db = await connectDB();
  const result = await db
    .collection("nesting_jobs")
    .findOne(
      { slug: resultSlug, ownerId: userId },
      { projection: { svg_file: 1 } }
    );

  if (!result) {
    setResponseStatus(404);
    return;
  }

  const svgFileName = result.svg_file;

  if (!svgFileName) {
    setResponseStatus(404);
    return;
  }

  const svgResultBucket = await getSvgResultBucket();

  const readStream = svgResultBucket.openDownloadStreamByName(svgFileName);

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
