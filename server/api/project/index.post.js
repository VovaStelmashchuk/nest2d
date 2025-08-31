import { defineEventHandler, createError } from "h3";

import { connectDB } from "~~/server/db/mongo";
import { saveFilesToProject } from "~~/server/core/project/dxf";
import {
  generateRandomString,
  generateEntityName,
} from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";
import { track } from "~~/server/utils/tracking";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const db = await connectDB();
  const projectName = generateEntityName();
  const projectSlug = `${standardSlugify(projectName, {
    keepCase: false,
  })}-${generateRandomString(6)}`;

  track("create_project", userId, {
    projectName: projectName,
    projectSlug: projectSlug,
  })

  await db.collection("projects").insertOne({
    slug: projectSlug,
    name: projectName,
    createdAt: new Date(),
    ownerId: userId,
  });

  await saveFilesToProject(event, projectSlug, userId);

  return {
    slug: projectSlug,
  };
});
