import { connectDB, getAvatarBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const db = await connectDB();
  const avatarBucket = await getAvatarBucket();

  const user = await db
    .collection("users")
    .findOne({ id: userId }, { projection: { avatarFileName: 1 } });

  const avatar = user?.avatarFileName;
  if (!avatar) {
    setResponseStatus(404);
    return;
  }

  const readStream = avatarBucket.openDownloadStreamByName(avatar);

  setResponseHeaders(event, {
    "Content-Type": "image/jpeg",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
