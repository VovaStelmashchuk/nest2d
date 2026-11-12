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
  const [strip] = await sql`SELECT name, slug, owner_id FROM strip_projects WHERE slug = ${slug}`;

  if (!strip) {
    throw createError({ statusCode: 404, message: "Strip project not found" });
  }

  if (strip.ownerId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const stripFiles = await sql`
    SELECT slug, name, processing_status, polygon_parts
    FROM strip_user_dxf_files
    WHERE strip_slug = ${slug} AND owner_id = ${userId}
    ORDER BY upload_at, id
  `;

  return {
    name: strip.name,
    slug: strip.slug,
    files: stripFiles.map((file) => mapFileToUi(file)),
  };
});

const mapFileToUi = (file) => {
  let status;
  if (file.processingStatus === "completed") {
    status = "done";
  } else if (
    file.processingStatus === "processing" ||
    file.processingStatus === "pending"
  ) {
    status = "in-progress";
  } else {
    status = file.processingStatus;
  }

  return {
    slug: file.slug,
    name: file.name,
    dxfUrl: `/api/files/strip/dxf/${file.slug}`,
    minHeight: minRequiredHeight(file),
    processingStatus: status,
  };
};

// Minimum strip height required to nest a file is the tallest of its polygon
// parts, since every part must fit within the strip height.
const minRequiredHeight = (file) => {
  const parts = file.polygonParts || [];
  const heights = parts
    .map((part) => part.height)
    .filter((height) => typeof height === "number");

  if (heights.length === 0) {
    return null;
  }

  return Math.max(...heights);
};
