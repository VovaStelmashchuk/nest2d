import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  const db = await connectDB();
  const project = await db.collection("projects_v2").findOne({ slug: slug });

  if (!project) {
    return { statusCode: 404, body: { error: "Project not found" } };
  }

  const response = {
    projectName: project.projectName,
  };

  event.node.res.setHeader("Content-Type", "image/jpeg");
  return project.image.buffer;
});
