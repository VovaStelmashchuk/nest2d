import { getUserDxfFilesSvgBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const fileName = getRouterParam(event, "file");

  const userDxfSvgFiles = await getUserDxfFilesSvgBucket();

  const files = await userDxfSvgFiles.find({ filename: fileName }).toArray()
  const metadata = files[0].metadata

  if (metadata.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const readStream = userDxfSvgFiles.openDownloadStreamByName(fileName);

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
