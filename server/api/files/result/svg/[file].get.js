import { BUCKET, getFile } from "~/server/db/files";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const fileName = getRouterParam(event, "file");

  const file = await getFile(BUCKET.NEST_SVG, fileName);
  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: `File ${fileName} not found`,
    });
  }

  if (file.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
  });
  return file.data;
});
