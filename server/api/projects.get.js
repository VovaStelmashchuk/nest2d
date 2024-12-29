import { defineEventHandler } from "h3";
import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (_) => {
  const db = await connectDB();

  const projects = await db
    .collection("projects_v2")
    .find()
    .project({ slug: 1, projectName: 1, _id: 0 })
    .toArray();

  const response = projects.map((project) => {
    return {
      slug: project.slug,
      projectName: project.projectName,
      imageUrl: `/api/project/${project.slug}/preview`,
    };
  });

  return {
    projects: response,
  };
});
