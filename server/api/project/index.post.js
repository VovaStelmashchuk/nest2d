import { defineEventHandler, createError } from "h3";

import { getDb } from "~~/server/db/postgres";
import { saveFilesToProject } from "~~/server/core/project/dxf";
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
  const sql = await getDb();
  const projectName = generateEntityName();
  const projectSlug = `${standardSlugify(projectName, {
    keepCase: false,
  })}-${generateRandomString(6)}`;

  await sql`
    INSERT INTO projects (slug, name, owner_id)
    VALUES (${projectSlug}, ${projectName}, ${userId})
  `;

  await saveFilesToProject(event, projectSlug, userId);

  return {
    slug: projectSlug,
  };
});
