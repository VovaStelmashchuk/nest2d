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
  if (!files[0]?.metadata) {
    throw createError({
      statusCode: 404,
      statusMessage: `File ${fileName} not found`,
    });
  }
  const metadata = files[0].metadata;

  if (metadata.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const readStream = svgResultBucket.openDownloadStreamByName(fileName);

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
  });
  return readStream;
});
