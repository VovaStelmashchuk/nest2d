import { getDb } from "~~/server/db/postgres";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const slug = getRouterParam(event, "slug");

  const sql = await getDb();
  const [project] = await sql`SELECT name, slug FROM projects WHERE slug = ${slug}`;

  if (!project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  const projectFiles = await sql`
    SELECT slug, name, processing_status, svg_file_slug, polygon_parts
    FROM user_dxf_files
    WHERE project_slug = ${slug} AND owner_id = ${userId}
    ORDER BY upload_at, id
  `;

  return {
    name: project.name,
    slug: project.slug,
    files: projectFiles.map((file) => mapFileToUi(file)),
  };
});

const mapFileToUi = (file) => {
  const svgUrl =
    file.processingStatus === "completed"
      ? `/api/files/project/svg/${file.svgFileSlug}`
      : null;

  const dxfUrl =
    file.processingStatus === "completed"
      ? `/api/files/project/dxf/${file.slug}`
      : null;

  let status;
  if (file.processingStatus === "completed") {
    status = "done";
  } else if (file.processingStatus === "processing" || file.processingStatus === "pending") {
    status = "in-progress";
  } else {
    status = file.processingStatus;
  }

  const parts = file.polygonParts || [];

  const uiParts = parts.map((part) => {
    return {
      width: Math.round(part.width * 10) / 10,
      height: Math.round(part.height * 10) / 10,
    };
  });

  return {
    slug: file.slug,
    name: file.name,
    svgUrl: svgUrl,
    dxfUrl: dxfUrl,
    processingStatus: status,
    parts: uiParts,
  };
};
