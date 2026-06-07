import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import logger from "~~/server/utils/logger";
import { trackEvent } from "~~/server/tracking/add";
import { assertCanNest } from "~~/server/utils/entitlement";

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

  const projectSlug = getRouterParam(event, "slug");

  trackEvent(event, "request_nesting", {
    projectSlug: projectSlug,
  });

  // Legacy (flag-off) users keep the pay-as-you-go credit check up front.
  // Feature-flagged users are gated by assertCanNest just before enqueue.
  if (!user.isStripFeatureEnable && user.balance < 1) {
    throw createError({
      statusCode: 402,
      statusMessage: "Not enough credits",
    });
  }
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
    const requestFile = filteredFiles.find((f) => f.slug === file.slug)
    return {
      slug: file.slug,
      simpleName: file.name.replace('.dxf', ''),
      count: requestFile?.count || 0,
      rotations: requestFile?.rotation ? JSON.parse(requestFile.rotation) : [0, 90, 180, 270]
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
    addOutShape: params.addOutShape,
  }

  // Subscription / free-quota gate for feature-flagged users. Consumes a free
  // nesting operation only once the request is fully validated.
  if (user.isStripFeatureEnable) {
    await assertCanNest(userId);
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
