import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { getDxfArray } from "~~/server/utils/multipart";

export default defineEventHandler(async (event) => {
  try {
    const fields = await readMultipartFormData(event);
    const dxfFileFields = fields.filter((field) => field.name === "dxf");
    const dxfStrings = getDxfArray(dxfFileFields);

    const db = await connectDB();
    await db.collection("nesting").insertOne({
      dxf: dxfStrings,
      uploadedAt: new Date(),
    });

    return {
      message: "Nest start",
    };
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 500, message: err.message });
  }
});
