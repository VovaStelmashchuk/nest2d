import { connectDB } from "~/server/db/mongo"; // Replace with your DB connection logic

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId || "anonymous";

  const db = await connectDB();

  const userProjects = await db
    .collection("projects")
    .find({ ownerId: userId })
    .sort({ uploadedAt: -1 })
    .project({ slug: 1, name: 1, createdAt: 1 })
    .toArray();

  const projectSlugs = userProjects.map((project) => project.slug);

  const nestRequestCounts = await db
    .collection("nest_request")
    .aggregate([
      { $match: { projectSlug: { $in: projectSlugs } } }, // Filter only relevant projectSlugs
      { $group: { _id: "$projectSlug", count: { $sum: 1 } } }, // Count occurrences of each projectSlug
    ])
    .toArray();

  const countMap = nestRequestCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const uiProjects = userProjects.map((project) =>
    mapProject(project, countMap)
  );

  return {
    projects: uiProjects,
  };
});

function mapProject(project, countMap) {
  return {
    slug: project.slug,
    name: project.name,
    imageUrl: "/placeholder.svg",
    createdAt: project.createdAt,
    nestRequestCount: countMap[project.slug] || 0, // Ensure 0 if no matches
  };
}
