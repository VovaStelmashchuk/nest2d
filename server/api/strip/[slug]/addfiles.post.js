import { defineEventHandler, createError } from "h3";

import { connectDB } from "~~/server/db/mongo";
import { saveFilesToStripProject } from "~~/server/core/strip/dxf";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const stripSlug = getRouterParam(event, "slug");

  const db = await connectDB();

  const strip = await db.collection("strip_projects").findOne({
    slug: stripSlug,
  });

  if (!strip) {
    throw createError({ statusCode: 404, message: "Strip project not found" });
  }

  if (strip.ownerId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  await saveFilesToStripProject(event, stripSlug, userId);

  return {
    slug: stripSlug,
  };
});
