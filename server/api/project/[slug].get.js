import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  const db = await connectDB();
  const project = await db.collection("projects").findOne({ slug: slug });

  if (!project) {
    throw createError({ statusCode: 404, message: "Project not found" });
  }

  return {
    name: project.name,
    slug: project.slug,
    files: project.dxf.map((dxf) => {
      return {
        slug: dxf.slug,
        name: dxf.name,
        svg: dxf.svg,
      };
    }),
  };
});
