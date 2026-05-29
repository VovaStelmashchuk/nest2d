import { defineEventHandler, createError } from "h3";

import { connectDB } from "~~/server/db/mongo";
import { saveFilesToStripProject } from "~~/server/core/strip/dxf";
import {
  generateRandomString,
  generateEntityName,
} from "~~/server/utils/strings";
import standardSlugify from "standard-slugify";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const db = await connectDB();
  const stripName = generateEntityName();
  const stripSlug = `${standardSlugify(stripName, {
    keepCase: false,
  })}-${generateRandomString(6)}`;

  await db.collection("strip_projects").insertOne({
    slug: stripSlug,
    name: stripName,
    createdAt: new Date(),
    ownerId: userId,
  });

  await saveFilesToStripProject(event, stripSlug, userId);

  return {
    slug: stripSlug,
  };
});
