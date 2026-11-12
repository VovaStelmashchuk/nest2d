import { BUCKET, getFile } from "~/server/db/files";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(event, 401);
    return;
  }

  const avatar = await getFile(BUCKET.AVATAR, userId);
  if (!avatar) {
    setResponseStatus(event, 404);
    return;
  }

  setResponseHeaders(event, {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return avatar.data;
});
