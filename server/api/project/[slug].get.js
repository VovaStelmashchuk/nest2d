import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  const db = await connectDB();
  const project = await db.collection("projects_v2").findOne({ slug: slug });

  if (!project) {
    return { statusCode: 404, body: { error: "Project not found" } };
  }

  return {
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
