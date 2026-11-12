import { defineEventHandler, createError } from "h3";

import { getDb } from "~~/server/db/postgres";
import { saveFilesToProject } from "~~/server/core/project/dxf";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const projectSlug = getRouterParam(event, "slug");

  const sql = await getDb();

  const [project] = await sql`SELECT owner_id FROM projects WHERE slug = ${projectSlug}`;

  if (!project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  if (project.ownerId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  await saveFilesToProject(event, projectSlug, userId);

  return {
    slug: projectSlug,
  };
});
