import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { getDxfArray } from "~~/server/utils/multipart";
import { generateSvg } from "../core/svg/generator";
import { generateRandomString } from "../utils";

export default defineEventHandler(async (event) => {
  try {
    const fields = await readMultipartFormData(event);
    const dxfFileFields = fields.filter((field) => field.name === "dxf");

    const dxfRecords = getDxfArray(dxfFileFields).map(function (dxf) {
      const svgResult = generateSvg(dxf.data);
      return {
        slug: `${dxf.filename}-${generateRandomString(6)}`,
        name: dxf.filename,
        data: dxf.data,
        svg: svgResult.svg,
        generateSvgError: svgResult.error,
      };
    });

    const db = await connectDB();
    const insertResult = await db.collection("projects_v2").insertOne({
      dxf: dxfRecords,
      uploadedAt: new Date(),
    });

    const id = insertResult.insertedId.toString();

    const slug = `slug-${id}`;
    await db
      .collection("projects_v2")
      .updateOne({ _id: insertResult.insertedId }, { $set: { slug: slug } });

    return {
      message: "Project saved",
      slug: slug,
    };
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, message: err.message });
  }
});
