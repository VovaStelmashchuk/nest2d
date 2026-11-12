import { defineEventHandler, createError } from "h3";

import { getDb } from "~~/server/db/postgres";
import { saveFilesToStripProject } from "~~/server/core/strip/dxf";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";
import {
  generateRandomString,
  generateEntityName,
} from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);
  const sql = await getDb();
  const stripName = generateEntityName();
  const stripSlug = `${standardSlugify(stripName, {
    keepCase: false,
  })}-${generateRandomString(6)}`;

  await sql`
    INSERT INTO strip_projects (slug, name, owner_id)
    VALUES (${stripSlug}, ${stripName}, ${userId})
  `;

  await saveFilesToStripProject(event, stripSlug, userId);

  return {
    slug: stripSlug,
  };
});
