import { connectDB } from "~/server/db/mongo";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);

  const db = await connectDB();
  const stripProjects = await db
    .collection("strip_projects")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .project({ slug: 1, name: 1, createdAt: 1 })
    .toArray();

  const projects = stripProjects.map((project) => ({
    slug: project.slug,
    name: project.name,
    createdAt: project.createdAt,
    results: 0,
  }));

  return {
    projects: projects,
  };
});
