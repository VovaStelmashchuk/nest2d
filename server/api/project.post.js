import {
  defineEventHandler,
  createError,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { connectDB } from "~~/server/db/mongo";
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
    for (const field of fields) {
      if (field.type && field.data && field.data.length > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 400,
          message: `File "${field.filename}" exceeds the 1MB size limit. We currently do not support files larger than 1MB.`,
        });
      }
    }

    const dxfArray = getDxfArray(dxfFileFields);

    const name = generateEntityName();
    const slug = `${name}-${generateRandomString(6)}`;

    const insertResult = await db.collection("projects").insertOne({
      slug: slug,
      name: name,
      dxf: dxfArray,
      uploadedAt: new Date(),
      ownerId: userId,
    });

    const dxfRecords = dxfArray.map(function (dxf) {
      const dxfAsObjectStr = dxf2json({
        stringData: dxf.data,
      });
      const dxfAsObject = JSON.parse(dxfAsObjectStr);

      return {
        slug: `${dxf.filename}-${generateRandomString(6)}`,
        name: dxf.filename,
        data: dxf.data,
        asObject: dxfAsObject,
      };
    });

    db.collection("projects").updateOne(
      { _id: insertResult.insertedId },
      { $set: { dxf: dxfRecords } }
    );

    dxfRecords.forEach((dxfRecord) => {
      const svgResult = generateSvg(dxfRecord.asObject);
      dxfRecord.svg = svgResult.svg;
      dxfRecord.generateSvgError = svgResult.error;

      db.collection("projects").updateOne(
        { _id: insertResult.insertedId },
        { $set: { dxf: dxfRecords } }
      );
    });

    return {
      message: "Project saved",
      slug: slug,
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
