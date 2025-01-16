import { __asyncValues } from "tslib";
import { db } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatusCode(401);
    return;
  }

  const user = await db.collection("users").findOne({ id: userId });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
});
