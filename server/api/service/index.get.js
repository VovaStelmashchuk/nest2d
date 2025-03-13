import { defineEventHandler } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { getCommitSha } from "~~/server/utils/config";

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

  try {
    commitSha = getCommitSha();
  } catch (e) {
    console.error(e);
    commitSha = `Error getting commit sha ${e}`;
  }

  return {
    userId: userId,
    provider: user?.provider || "unknown",
    isAdmin: user?.sAdmin || false,
    isDbConnected: isDbConnected,
    commitSha: commitSha,
  };
});
