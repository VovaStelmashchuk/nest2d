import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { getDxfArray } from "~~/server/utils/multipart";
import { generateSvg } from "../core/svg/generator";
import { generateRandomString } from "~~/server/utils/strings";
import { dxf2Json } from "~~/libs/deepnest_dxf2svg-processor";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const db = await connectDB();
  try {
    const fields = await readMultipartFormData(event);
    const dxfFileFields = fields.filter((field) => field.name === "dxf");
    const dxfArray = getDxfArray(dxfFileFields);

    const slug = `slug-${generateRandomString(6)}`;

    const insertResult = await db.collection("projects").insertOne({
      slug: slug,
      dxf: dxfArray,
      uploadedAt: new Date(),
      ownerId: userId,
    });

    const dxfRecords = dxfArray.map(function (dxf) {
      const dxfAsObjectStr = dxf2Json({
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
    throw createError({ statusCode: 500, message: err.message });
  }
});
