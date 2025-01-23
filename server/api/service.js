import { defineEventHandler } from "h3";
import { connectDB } from "~~/server/db/mongo";

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

  return {
    userId: userId,
    isDbConnected: isDbConnected,
    version: "0.1.0",
  };
});
