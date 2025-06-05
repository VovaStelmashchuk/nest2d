import { getSvgResultBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const fileName = getRouterParam(event, "file");

  const svgResultBucket = await getSvgResultBucket();

  const files = await svgResultBucket.find({ filename: fileName }).toArray()
  const metadata = files[0].metadata

  if (metadata.ownerId !== userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const readStream = svgResultBucket.openDownloadStreamByName(fileName);

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
