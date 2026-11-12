import { getDb } from "~/server/db/postgres";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);

  const sql = await getDb();
  const stripProjects = await sql`
    SELECT slug, name, created_at FROM strip_projects
    WHERE owner_id = ${userId}
    ORDER BY created_at DESC
  `;

  const projects = stripProjects.map((project) => ({
    slug: project.slug,
    name: project.name,
    createdAt: project.createdAt,
    results: 0,
  }));

  return {
    projects: projects,
  };
});
