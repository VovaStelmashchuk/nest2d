import { connectDB } from "~~/server/db/mongo";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);

  const slug = getRouterParam(event, "slug");

  const db = await connectDB();

  const strip = await db
    .collection("strip_projects")
    .findOne({ slug: slug, ownerId: userId }, { projection: { slug: 1 } });
  if (!strip) {
    throw createError({ statusCode: 404, message: "Strip project not found" });
  }

  const jobs = await db
    .collection("strip_nesting_job_queue")
    .find({ stripSlug: slug, ownerId: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    items: jobs.map((job) => mapJobToUi(job)),
  };
});

const mapJobToUi = (job) => {
  const files = job.files || [];
  const dxfFile = (job.dxf_files || [])[0] || null;
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
