import { createError, readMultipartFormData } from "h3";

import { connectDB, getUserDxfBucket } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";

import standardSlugify from "standard-slugify";

export async function saveFilesToProject(event, projectSlug, userId) {
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
  const file_records = [];

  dxfFileFields.forEach((dxfFile) => {
    const fileBuffer = dxfFile.data;
    const userFileName = dxfFile.filename;
    const file_slug = standardSlugify(userFileName, {
      keepCase: false,
    }) + `-${generateRandomString(6)}.dxf`;

    const uploadSream = dxfUserBucket.openUploadStream(file_slug);
    uploadSream.write(fileBuffer);
    uploadSream.end();

    const dxfRecord = {
      slug: file_slug,
      name: userFileName,
    };
    dxfs.push(dxfRecord);

    const file_record = {
      slug: file_slug,
      name: userFileName,
      processingStatus: "pending",
      projectSlug: projectSlug,
      ownerId: userId,
      uploadAt: new Date(),
      flattening: 0.01,
    };

    file_records.push(file_record);
  });

  const db = await connectDB();

  await db.collection("user_dxf_files").insertMany(file_records);
}
