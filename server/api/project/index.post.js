import { defineEventHandler, createError } from "h3";

import { connectDB } from "~~/server/db/mongo";
import { saveFilesToProject } from "~~/server/core/project/dxf";
import {
  generateRandomString,
  generateEntityName,
} from "~~/server/utils/strings";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const db = await connectDB();
  const projectName = generateEntityName();
  const projectSlug = `${projectName}-${generateRandomString(6)}`;

  await db.collection("projects").insertOne({
    slug: projectSlug,
    name: projectName,
    uploadedAt: new Date(),
    ownerId: userId,
  });

  saveFilesToProject(event, projectSlug);

  return {
    slug: projectSlug,
  };
});
