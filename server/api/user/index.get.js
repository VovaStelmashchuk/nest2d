import { connectDB } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return {};
  }

  const db = await connectDB();
  const user = await db.collection("users").findOne({ id: userId });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl || "/api/user/avatar",
  };
});
