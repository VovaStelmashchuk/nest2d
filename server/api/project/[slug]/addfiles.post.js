import { defineEventHandler, createError } from "h3";

import { connectDB } from "~~/server/db/mongo";
import { saveFilesToProject } from "~~/server/core/project/dxf";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const projectSlug = getRouterParam(event, "slug");

  const db = await connectDB();

  const project = await db.collection("projects").findOne({
    slug: projectSlug,
  });

  const projectOwnerId = project.ownerId;

  if (projectOwnerId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  await saveFilesToProject(event, projectSlug);

  return {
    slug: projectSlug,
  };
});
