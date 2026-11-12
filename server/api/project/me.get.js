import { getDb } from "~/server/db/postgres";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  const sql = await getDb();
  const projects = await sql`
    SELECT p.slug, p.name, p.created_at, count(j.id)::int AS results
    FROM projects p
    LEFT JOIN nesting_jobs j ON j.project_slug = p.slug AND j.owner_id = p.owner_id
    WHERE p.owner_id = ${userId}
    GROUP BY p.slug
    ORDER BY p.created_at DESC
  `;

  return {
    projects: projects.map((project) => ({
      slug: project.slug,
      name: project.name,
      createdAt: project.createdAt,
      results: project.results,
    })),
  };
});
