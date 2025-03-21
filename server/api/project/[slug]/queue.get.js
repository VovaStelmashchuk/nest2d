import { connectDB } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  const projectSlug = getRouterParam(event, "slug");

  if (!userId) {
    setResponseStatus(event, 401);
    return;
  }

  const db = await connectDB();
  const project = await db
    .collection("projects")
    .findOne(
      { slug: projectSlug, ownerId: userId },
      { projection: { ownerId: 1, name: 1 } }
    );

  if (!project) {
    setResponseStatus(event, 404);
    return;
  }

  if (project.ownerId !== userId) {
    setResponseStatus(event, 403);
    return;
  }

  const queueList = await db
    .collection("nesting_jobs")
    .find({ ownerId: userId, projectSlug: projectSlug })
    .sort({ createdAt: -1 })
    .project({ slug: 1, status: 1, createdAt: 1, projectSlug: 1 })
    .toArray();

  const respnoseItems = queueList.map((queueItem) => {
    return {
      slug: queueItem.slug,
      status: queueItem.status,
      createdAt: queueItem.createdAt,
      svg: "/api/result/" + queueItem.slug + "/svg",
      projectSlug: queueItem.projectSlug,
      projectName: project.name,
    };
  });

  return {
    items: respnoseItems.filter((item) => item),
  };
});
