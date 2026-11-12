import { getDb } from "~~/server/db/postgres";
import { trackEvent } from "~~/server/tracking/add";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  let isDbConnected = false;
  let user = null;

  try {
    const sql = await getDb();
    [user] = await sql`SELECT provider, is_admin FROM users WHERE id = ${userId}`;
    isDbConnected = true;
  } catch (e) {
    console.error(e);
  }

  let commitSha = "init unknown";

  await trackEvent(event, "service_index_get")

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
