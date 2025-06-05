import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
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
  const body = await readBody(event);
  /**
   * @type {{originFiles: {name: string, count: int}[], params: {height: float, width: float, tolerance: float, space: float}}}
   **/
  const { files, params } = body;
  const filteredFiles = files.filter((file) => file.count > 0);

  const project = await db.collection("projects").findOne({ slug: projectSlug, ownerId: userId })
  const projectDxfFiles = project.dxf

  const dbFiles = filteredFiles.map((file) => {
    const projectDxfFile = projectDxfFiles.find((dxfFile) => dxfFile.slug === file.slug)
    if (!projectDxfFile) {
      throw createError({
        statusCode: 400,
        statusMessage: "Dxf file not found",
      });
    }
    return {
      ...file,
      name: projectDxfFile.name.replace('.dxf', '')
    }
  })

  const slug = `nested-${dbFiles.map((file) => {
    const fileNameSlug = standardSlugify(file.name, { keepCase: false })
    return fileNameSlug + '_' + file.count
  }).join('-')}-${generateRandomString(4)}`;

  const dbParams = {
    height: params.height,
    width: params.width,
    tolerance: params.tolerance,
    space: params.space,
    sheetCount: 1
  }

  await db.collection("nesting_jobs").insertOne({
    slug: slug,
    projectSlug: projectSlug,
    files: dbFiles,
    params: dbParams,
    status: "pending",
    createdAt: new Date(),
    ownerId: userId,
  });

  return {
    slug: slug,
  };
});
