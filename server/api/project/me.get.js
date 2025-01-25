import { connectDB } from "~/server/db/mongo"; // Replace with your DB connection logic

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  const db = await connectDB();

  const userProjects = await db
    .collection("projects")
    .find({ ownerId: userId })
    .sort({ uploadedAt: -1 })
    .project({ slug: 1, name: 1 })
    .toArray();

  const uiProjects = userProjects.map(mapProject);

  return {
    projects: uiProjects,
  };
});

function mapProject(project) {
  return {
    slug: project.slug,
    name: project.name,
    imageUrl: "/placeholder.svg",
  };
}
