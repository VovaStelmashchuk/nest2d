import { defineEventHandler, readBody } from "h3";
import { connectDB, getUserDxfBucket } from "~~/server/db/mongo";
import { generateRandomString, streamToString } from "~~/server/utils/strings";
import { dxf2json } from "@deepnest/dxf2svg-processor";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const projectSlug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const { files, params } = body;

  const db = await connectDB();

  const userDxfBucket = await getUserDxfBucket();

  const objectsToNest = await Promise.all(
    files.map(async (file) => {
      const readStream = userDxfBucket.openDownloadStreamByName(file.slug);
      const string = await streamToString(readStream);

      const dxfAsObjectStr = dxf2json({
        stringData: string,
      });

      const dxfAsObject = JSON.parse(dxfAsObjectStr);

      return {
        dxfObject: dxfAsObject,
        count: file.count,
      };
    })
  );

  const slug = `nest-${generateRandomString(6)}`;

  const jobData = {
    slug,
    projectSlug,
    files,
    params,
    objectsToNest,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: userId,
  };

  const { insertedId } = await db.collection("nest_request").insertOne(jobData);

  return {
    jobId: insertedId,
    slug: slug,
  };
});
