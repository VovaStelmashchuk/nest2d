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
      { projection: { ownerId: 1 } }
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
    .collection("nest_request")
    .find({ ownerId: userId, projectSlug: projectSlug })
    .sort({ createdAt: -1 })
    .project({ slug: 1, status: 1, createdAt: 1, projectSlug: 1 })
    .toArray();

  const respnoseItems = queueList.map((queueItem) => {
    return {
      slug: queueItem.slug,
      status: queueItem.status,
      createdAt: queueItem.createdAt,
    };
  });

  return {
    items: respnoseItems.filter((item) => item),
  };
});
