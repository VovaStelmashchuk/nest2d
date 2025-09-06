import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import logger from "~~/server/utils/logger";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  const db = await connectDB();
  const user = await db.collection("users").findOne({ id: userId });
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (user.balance < 1) {
    throw createError({
      statusCode: 402,
      statusMessage: "Not enough credits",
    });
  }

  const projectSlug = getRouterParam(event, "slug");
  const project = await db.collection("projects").findOne({ slug: projectSlug, ownerId: userId })
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project not found",
    });
  }
  const body = await readBody(event);
  /**
   * @type {{originFiles: {name: string, count: int}[], params: {height: float, width: float, space: float}}}
   **/
  const { files, params } = body;

  const filteredFiles = files.filter((file) => file.count > 0);

  const userDxfFilesDatabase = await db.collection("user_dxf_files").find({
    slug: { $in: filteredFiles.map((file) => file.slug) }
  }).project({
    _id: 0,
    slug: 1,
    name: 1,
  }).toArray()

  const fileMetadata = userDxfFilesDatabase.map((file) => {
    return {
      slug: file.slug,
      simpleName: file.name.replace('.dxf', ''),
      count: filteredFiles.find((f) => f.slug === file.slug)?.count || 0
    }
  })

  const nestingSlug = `nested-${fileMetadata.map((file) => {
    const fileNameSlug = standardSlugify(file.simpleName, { keepCase: false })
    return fileNameSlug + '_' + file.count
  }).join('-')}-${generateRandomString(6)}`;

  const dbParams = {
    height: params.height,
    width: params.width,
    space: params.space,
    sheetCount: params.sheetCount,
  }

  await db.collection("nesting_jobs").insertOne({
    slug: nestingSlug,
    projectSlug: projectSlug,
    files: fileMetadata,
    params: dbParams,
    status: "pending",
    createdAt: new Date(),
    ownerId: userId,
  });

  return {
    slug: nestingSlug,
  };
});
