import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatusCode(401);
    return;
  }

  const projectSlug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const { projectName } = body;

  const db = await connectDB();
  const result = await db
    .collection("projects")
    .updateOne(
      { slug: projectSlug, ownerId: userId },
      { $set: { name: projectName } }
    );

  if (result.modifiedCount === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project not found",
    });
  }

  return;
});
