import { defineEventHandler, createError } from "h3";

import { getDb } from "~~/server/db/postgres";
import { saveFilesToStripProject } from "~~/server/core/strip/dxf";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);
  const stripSlug = getRouterParam(event, "slug");

  const sql = await getDb();

  const [strip] = await sql`SELECT owner_id FROM strip_projects WHERE slug = ${stripSlug}`;

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
