import { connectDB } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const db = await connectDB();
  const queueList = await db
    .collection("nest_request")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .project({ slug: 1, status: 1, createdAt: 1, projectSlug: 1 })
    .toArray();

  const respnoseItems = queueList.map((queueItem) => {
    return {
      slug: queueItem.slug,
      status: queueItem.status,
      createdAt: queueItem.createdAt,
      svg: "/api/result/" + queueItem.slug + "/svg",
    };
  });

  return {
    items: respnoseItems.filter((item) => item),
  };
});
