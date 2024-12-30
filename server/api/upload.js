import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { getDxfArray } from "~~/server/utils/multipart";

import standardSlugify from "standard-slugify";

export default defineEventHandler(async (event) => {
  try {
    const fields = await readMultipartFormData(event);

    const projectNameField = fields.find(
      (field) => field.name === "projectName"
    );
    const projectName = getProjectName(projectNameField);
    const slug = standardSlugify(projectName);

    const imageField = fields.find((field) => field.name === "image");
    const imageBuffer = getImageBuffer(imageField);

    const dxfFileFields = fields.filter((field) => field.name === "dxf");
    const dxfStrings = getDxfArray(dxfFileFields);

    const db = await connectDB();
    await db.collection("projects_v2").insertOne({
      slug: slug,
      projectName: projectName,
      image: imageBuffer,
      dxf: dxfStrings,
      uploadedAt: new Date(),
    });

    const projectFromDb = await db
      .collection("projects_v2")
      .findOne(
        { slug: slug },
        { projection: { slug: 1, projectName: 1, _id: 0 } }
      );

    return projectFromDb;
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, message: err.message });
  }
});

function getProjectName(field) {
  const projectNameRaw = field?.data;
  const projectName = projectNameRaw ? projectNameRaw.toString() : null;
  if (!projectName) {
    throw createError({
      statusCode: 400,
      message: "Project name is required.",
    });
  }

  return projectName;
}

function getImageBuffer(field) {
  const imageBuffer = field?.data;
  if (!imageBuffer) {
    throw createError({
      statusCode: 400,
      message: "Image file is required.",
    });
  }

  return imageBuffer;
}
