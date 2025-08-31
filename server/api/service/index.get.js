import { connectDB } from "~~/server/db/mongo";
import { track } from "~~/server/utils/tracking";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";
  const db = await connectDB();

  let isDbConnected = false;

  try {
    await db.command({ ping: 1 });
    isDbConnected = true;
  } catch (e) {
    console.error(e);
  }

  const user = await db.collection("users").findOne({ id: userId });

  let commitSha = "init unknown";

  track("service_index_get", userId)

  try {
    commitSha = useRuntimeConfig().public.gitCommitSha;
  } catch (e) {
    console.error(e);
    commitSha = `Error getting commit sha ${e}`;
  }

  return {
    userId: userId,
    provider: user?.provider || "unknown",
    isAdmin: user?.isAdmin || false,
    isDbConnected: isDbConnected,
    commitSha: commitSha,
  };
});
