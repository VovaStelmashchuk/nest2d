import { connectDB } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    setResponseStatus(event, 401);
    return;
  }

  const db = await connectDB();
  const queueList = await db
    .collection("nest_request")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .project({ slug: 1, status: 1, createdAt: 1, projectSlug: 1 })
    .toArray();

  const allUniqueProjectSlugs = [
    ...new Set(queueList.map((item) => item.projectSlug)),
  ];

  const projects = await db
    .collection("projects")
    .find({ slug: { $in: allUniqueProjectSlugs } })
    .project({ slug: 1, name: 1 })
    .toArray();

  const respnoseItems = queueList.map((queueItem) => {
    const project = projects.find(
      (project) => project.slug == queueItem.projectSlug
    );
    if (project) {
      return {
        slug: queueItem.slug,
        status: queueItem.status,
        createdAt: queueItem.createdAt,
        svg: "/api/result/" + queueItem.slug + "/svg",
        projectSlug: queueItem.projectSlug,
        projectName: project.name,
      };
    } else {
      return null;
    }
  });

  return {
    items: respnoseItems.filter((item) => item),
  };
});
