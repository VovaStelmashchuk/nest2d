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

  const file = await getFile(BUCKET.USER_DXF_SVG, fileName);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  if (file.ownerId !== userId && !(event.context.auth.isAdmin == true)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return file.data;
});
