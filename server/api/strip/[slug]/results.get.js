import { getDb } from "~~/server/db/postgres";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);

  const slug = getRouterParam(event, "slug");

  const sql = await getDb();

  const [strip] = await sql`
    SELECT slug FROM strip_projects WHERE slug = ${slug} AND owner_id = ${userId}
  `;
  if (!strip) {
    throw createError({ statusCode: 404, message: "Strip project not found" });
  }

  const jobs = await sql`
    SELECT slug, status, params, width, files, dxf_files, created_at
    FROM strip_nesting_jobs
    WHERE strip_slug = ${slug} AND owner_id = ${userId}
    ORDER BY created_at DESC
  `;

  return {
    items: jobs.map((job) => mapJobToUi(job)),
  };
});

const mapJobToUi = (job) => {
  const files = job.files || [];
  const dxfFile = (job.dxfFiles || [])[0] || null;
  return {
    slug: job.slug,
    status: job.status,
    height: job.params?.height ?? null,
    width: job.width ?? null,
    fileCount: files.reduce((acc, file) => acc + (file.count || 0), 0),
    dxfUrl: dxfFile ? `/api/files/strip/nest/dxf/${dxfFile}` : null,
    createdAt: job.createdAt,
  };
};
