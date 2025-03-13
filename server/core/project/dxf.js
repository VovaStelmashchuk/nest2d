import { createError, readMultipartFormData } from "h3";

import { connectDB, getUserDxfBucket } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";

import standardSlugify from "standard-slugify";

export async function saveFilesToProject(event, projectSlug) {
  const fields = await readMultipartFormData(event);
  const dxfFileFields = fields.filter((field) => field.name === "dxf");

  if (dxfFileFields.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No DXF file uploaded. Please upload a DXF file.",
    });
  }

  const dxfUserBucket = await getUserDxfBucket();

  const dxfs = [];

  dxfFileFields.forEach((dxfFile) => {
    const fileBuffer = dxfFile.data;
    const userFileName = dxfFile.filename;
    const fileSlug = `${projectSlug}-${standardSlugify(userFileName, {
      keepCase: false,
    })}-${generateRandomString(6)}`;

    const uploadSream = dxfUserBucket.openUploadStream(fileSlug);
    uploadSream.write(fileBuffer);
    uploadSream.end();

    const dxfRecord = {
      slug: fileSlug,
      name: userFileName,
      processingStatus: "in-progress",
    };

    dxfs.push(dxfRecord);
  });

  const db = await connectDB();
  await db
    .collection("projects")
    .updateOne({ slug: projectSlug }, { $push: { dxf: { $each: dxfs } } });

  await db
    .collection("projects")
    .updateOne(
      { slug: projectSlug },
      { $set: { svgGeneratorStatus: "pending" } }
    );
}
