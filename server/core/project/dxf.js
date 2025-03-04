import { createError, readMultipartFormData } from "h3";

import { connectDB, getUserDxfBucket } from "~~/server/db/mongo";
import { generateSvg } from "~~/server/core/svg/generator";
import { generateRandomString } from "~~/server/utils/strings";

import { dxf2json } from "@deepnest/dxf2svg-processor";

export async function saveFilesToProject(event, projectSlug) {
  const fields = await readMultipartFormData(event);
  const dxfFileFields = fields.filter((field) => field.name === "dxf");

  if (dxfFileFields.length === 0) {
    throw createError({
      statusCode: 400,
      message: "No DXF file uploaded. Please upload a DXF file.",
    });
  }

  const dxfUser = await getUserDxfBucket();

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

  const db = await connectDB();
  await db
    .collection("projects")
    .updateOne({ slug: projectSlug }, { $push: { dxf: { $each: dxfs } } });
}
