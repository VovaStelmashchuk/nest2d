import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const projectSlug = getRouterParam(event, "slug");
  const body = await readBody(event);
  /**
   * @type {{originFiles: {name: string, count: int}[], params: {height: float, width: float, tolerance: float, space: float}}}
   **/
  const { files, params } = body;
  const filteredFiles = files.filter((file) => file.count > 0);

  const db = await connectDB();

  const slug = `nest-${generateRandomString(6)}`;

  await db.collection("nesting_jobs").insertOne({
    slug: slug,
    projectSlug: projectSlug,
    files: filteredFiles,
    params: params,
    status: "pending",
    createdAt: new Date(),
    ownerId: userId,
  });

  return {
    slug: slug,
  };
});
