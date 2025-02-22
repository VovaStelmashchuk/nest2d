import {
  defineEventHandler,
  createError,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { connectDB, getUserDxfBucket } from "~~/server/db/mongo";
import { getDxfArray } from "~~/server/utils/multipart";
import { generateSvg } from "../core/svg/generator";
import { generateRandomString } from "~~/server/utils/strings";
import { dxf2json } from "@deepnest/dxf2svg-processor";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const db = await connectDB();
  try {
    const fields = await readMultipartFormData(event);
    const dxfFileFields = fields.filter((field) => field.name === "dxf");

    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB in bytes
    if (dxfFileFields.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No DXF file uploaded. Please upload a DXF file.",
      });
    }
    for (const field of fields) {
      if (field.type && field.data && field.data.length > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 400,
          message: `File "${field.filename}" exceeds the 1MB size limit. We currently do not support files larger than 1MB.`,
        });
      }
    }

    const dxfUser = await getUserDxfBucket();

    const projectName = generateEntityName();
    const projectSlug = `${projectName}-${generateRandomString(6)}`;

    const dxfs = [];

    dxfFileFields.forEach((dxfFile) => {
      const fileBuffer = dxfFile.data;
      const userFileName = dxfFile.filename;
      const suffix = generateRandomString(6);
      const fileName = `${projectSlug}-${userFileName}-${suffix}`;

      const uploadSream = dxfUser.openUploadStream(fileName);
      uploadSream.write(fileBuffer);
      uploadSream.end();

      const dxfAsObjectStr = dxf2json({
        stringData: fileBuffer.toString(),
      });

      const dxfAsObject = JSON.parse(dxfAsObjectStr);

      const svgResult = generateSvg(dxfAsObject);

      const dxfRecord = {
        slug: fileName,
        name: userFileName,
        fileName: fileName,
        svg: svgResult.svg,
        svgError: svgResult.error,
      };

      dxfs.push(dxfRecord);
    });

    await db.collection("projects").insertOne({
      slug: projectSlug,
      name: projectName,
      uploadedAt: new Date(),
      ownerId: userId,
      dxf: dxfs,
    });

    return {
      message: "Project saved",
      slug: projectSlug,
    };
  } catch (err) {
    console.error(err);
    setResponseStatus(500);
    return {
      message:
        "Something went wrong, please verify your DXF file and try again.",
    };
  }
});
