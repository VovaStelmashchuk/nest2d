import { createError, readMultipartFormData } from "h3";

import { connectDB, getStripUserDxfBucket } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";
import { trackEvent } from "~~/server/tracking/add";

import standardSlugify from "standard-slugify";

export async function saveFilesToStripProject(event, stripSlug, userId) {
  const fields = await readMultipartFormData(event);
  const dxfFileFields = fields.filter((field) => field.name === "dxf");

  if (dxfFileFields.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No DXF file uploaded. Please upload a DXF file.",
    });
  }

  const dxfUserBucket = await getStripUserDxfBucket();

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

    const file_record = {
      slug: file_slug,
      name: userFileName,
      processingStatus: "pending",
      stripSlug: stripSlug,
      ownerId: userId,
      uploadAt: new Date(),
      flattening: 0.01,
      worker_tag: "strip",
    };

    file_records.push(file_record);
  });

  file_records.forEach((file_record) => {
    trackEvent(event, "create_strip_dxf_file", {
      fileName: file_record.name,
      fileSlug: file_record.slug,
      stripSlug: stripSlug,
    });
  });

  const db = await connectDB();

  await db.collection("strip_user_dxf_files").insertMany(file_records);
}
