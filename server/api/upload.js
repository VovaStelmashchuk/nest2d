import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { promises as fs } from "fs";
import path from "path";
import { db } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  db.collection("uploads").insertOne({ test: "test" });
  const uploadBasePath = path.resolve(".uploads");
  await fs.mkdir(uploadBasePath, { recursive: true });

  try {
    const fields = await readMultipartFormData(event);

    const projectNameBuffer = fields.find(
      (field) => field.name === "projectName"
    )?.data;
    const projectName = projectNameBuffer ? projectNameBuffer.toString() : null;
    if (!projectName) {
      throw createError({
        statusCode: 400,
        message: "Project name is required.",
      });
    }

    const projectPath = path.join(uploadBasePath, projectName);
    await fs.mkdir(projectPath, { recursive: true });

    const imageField = fields.find((field) => field.name === "image");
    const imageBuffer = imageField?.data;
    if (!imageBuffer) {
      throw createError({
        statusCode: 400,
        message: "Image file is required.",
      });
    }

    const imagePath = path.join(projectPath, "image_" + imageField.filename);
    await fs.writeFile(imagePath, imageBuffer);

    const dxfFileFields = fields.filter((field) => field.name === "dxf");
    if (!dxfFileFields || dxfFileFields.length === 0) {
      throw createError({
        statusCode: 400,
        message: "At least one DXF file is required.",
      });
    }

    const dxfBuffers = dxfFileFields.map((field) => ({
      filename: field.filename,
      buffer: field.data,
    }));

    for (const dxf of dxfBuffers) {
      const dxfPath = path.join(projectPath, "dxf_" + dxf.filename);
      await fs.writeFile(dxfPath, dxf.buffer);
    }

    return {
      success: true,
      message: `Files uploaded successfully for project ${projectName}`,
    };
  } catch (err) {
    throw createError({ statusCode: 500, message: err.message });
  }
});
