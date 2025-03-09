import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const slug = getRouterParam(event, "slug");

  const db = await connectDB();
  const project = await db.collection("projects").findOne(
    { slug: slug },
    {
      projection: {
        name: 1,
        slug: 1,
        "dxf.slug": 1,
        "dxf.name": 1,
        "dxf.svgExists": 1,
      },
    }
  );

  if (!project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  return {
    name: project.name,
    slug: project.slug,
    files: project.dxf.map((file) => mapFileToUi(project.slug, file)),
  };
});

const mapFileToUi = (projectSlug, file) => {
  const svgUrl = file.svgExists
    ? `/api/project/${projectSlug}/${file.slug}/svg`
    : null;

  return {
    slug: file.slug,
    name: file.name,
    svg: file.svg,
    svgUrl: svgUrl,
  };
};
