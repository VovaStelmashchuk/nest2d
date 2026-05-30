import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import { trackEvent } from "~~/server/tracking/add";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  await assertStripFeatureEnabled(userId);

  const db = await connectDB();

  const stripSlug = getRouterParam(event, "slug");

  trackEvent(event, "request_strip_nesting", {
    stripSlug: stripSlug,
  });

  const strip = await db
    .collection("strip_projects")
    .findOne({ slug: stripSlug, ownerId: userId });
  if (!strip) {
    throw createError({
      statusCode: 404,
      statusMessage: "Strip project not found",
    });
  }

  const body = await readBody(event);
  /**
   * @type {{files: {slug: string, count: number}[], params: {height: number}}}
   **/
  const { files, params } = body;

  const filteredFiles = (files || []).filter((file) => file.count > 0);

  if (filteredFiles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please select at least one file to nest.",
    });
  }

  const height = Number(params?.height);
  if (!Number.isFinite(height) || height <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please provide a valid height.",
    });
  }

  const stripFilesDatabase = await db
    .collection("strip_user_dxf_files")
    .find({
      slug: { $in: filteredFiles.map((file) => file.slug) },
      ownerId: userId,
    })
    .project({
      _id: 0,
      slug: 1,
      name: 1,
    })
    .toArray();

  const fileMetadata = stripFilesDatabase.map((file) => {
    const requestFile = filteredFiles.find((f) => f.slug === file.slug);
    return {
      slug: file.slug,
      simpleName: file.name.replace(".dxf", ""),
      count: requestFile?.count || 0,
    };
  });

  const jobSlug = `strip-nested-${fileMetadata
    .map((file) => {
      const fileNameSlug = standardSlugify(file.simpleName, { keepCase: false });
      return fileNameSlug + "_" + file.count;
    })
    .join("-")}-${generateRandomString(6)}`;

  await db.collection("strip_nesting_job_queue").insertOne({
    slug: jobSlug,
    stripSlug: stripSlug,
    files: fileMetadata,
    params: {
      height: height,
    },
    status: "pending",
    createdAt: new Date(),
    ownerId: userId,
  });

  return {
    slug: jobSlug,
  };
});
