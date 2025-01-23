import { connectDB } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    setResponseStatusCode(401);
    return;
  }

  const db = await connectDB();
  const queueList = await db
    .collection("nest_request")
    .find({ ownerId: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return {
    items: queueList.map(mapQueueItem),
  };
});

function mapQueueItem(queueItem) {
  return {
    slug: queueItem.slug,
    status: queueItem.status,
    createdAt: queueItem.createdAt,
  };
}
