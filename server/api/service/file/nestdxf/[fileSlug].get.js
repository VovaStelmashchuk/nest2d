import { connectDB, getDxfResultBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }
  console.log("userId", userId);
  const db = await connectDB();
  const user = await db.collection("users").findOne({ id: userId });
  if (user.isAdmin !== true) {
    setResponseStatus(403);
    return;
  }

  const fileSlug = getRouterParam(event, "fileSlug");

  const userDxfBucket = await getDxfResultBucket();

  const readStream = userDxfBucket.openDownloadStreamByName(fileSlug);

  setResponseHeaders(event, {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
