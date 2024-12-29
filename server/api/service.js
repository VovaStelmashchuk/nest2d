import { defineEventHandler } from "h3";
import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (_) => {
  const db = await connectDB();

  db.collection("uploads").insertOne({ name: "test1" });

  const response = {};
  response.version = "0.6.0";
  return response;
});
