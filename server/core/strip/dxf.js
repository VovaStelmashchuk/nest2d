import { createError, readMultipartFormData } from "h3";

import { getDb } from "~~/server/db/postgres";
import { BUCKET, saveFile } from "~~/server/db/files";
import { generateRandomString } from "~~/server/utils/strings";
import { trackEvent } from "~~/server/tracking/add";

import standardSlugify from "standard-slugify";

export async function saveFilesToStripProject(event, stripSlug, userId) {
  const fields = await readMultipartFormData(event);
  const dxfFileFields = (fields || []).filter((field) => field.name === "dxf");

  if (dxfFileFields.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No DXF file uploaded. Please upload a DXF file.",
    });
  }

  const sql = await getDb();

  const fileRecords = await sql.begin(async (tx) => {
    const records = [];
    for (const dxfFile of dxfFileFields) {
      const userFileName = dxfFile.filename;
      const fileSlug = standardSlugify(userFileName, {
        keepCase: false,
      }) + `-${generateRandomString(6)}.dxf`;

      await saveFile(BUCKET.STRIP_USER_DXF, fileSlug, userId, dxfFile.data, tx);

      const record = {
        slug: fileSlug,
        name: userFileName,
        processingStatus: "pending",
        stripSlug: stripSlug,
        ownerId: userId,
        flattening: 0.01,
        workerTag: "strip",
      };
      await tx`INSERT INTO strip_user_dxf_files ${tx(record)}`;
      records.push(record);
    }
    return records;
  });

  fileRecords.forEach((fileRecord) => {
    trackEvent(event, "create_strip_dxf_file", {
      fileName: fileRecord.name,
      fileSlug: fileRecord.slug,
      stripSlug: stripSlug,
    });
  });
}
