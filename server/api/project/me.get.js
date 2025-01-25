import { connectDB } from "~/server/db/mongo"; // Replace with your DB connection logic

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  const db = await connectDB();

  const userProjects = await db
    .collection("projects")
    .find({ ownerId: userId })
    .sort({ uploadedAt: -1 })
    .toArray();

  const uiProjects = userProjects.map(mapProject);

  return {
    projects: uiProjects,
  };
});

function mapProject(project) {
  const firstFile = project.dxf[0];

  return {
    slug: project.slug,
    name: project.name,
    imageSvg: firstFile.svg,
  };
}
