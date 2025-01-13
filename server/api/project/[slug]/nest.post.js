import { defineEventHandler, readBody } from "h3";
import { connectDB } from "~~/server/db/mongo";
import { generateRandomString } from "~~/server/utils/strings";

export default defineEventHandler(async (event) => {
  const projectSlug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const { files, params } = body;

  const db = await connectDB();

  const project = await db
    .collection("projects")
    .findOne({ slug: projectSlug });

  const objectsToNest = files.flatMap((file) => {
    const dxfObject = project.dxf.find((d) => d.slug === file.slug).asObject;

    return {
      dxfObject: dxfObject,
      count: file.count,
    };
  });

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
  };

  const { insertedId } = await db.collection("nest_request").insertOne(jobData);

  return {
    jobId: insertedId,
    slug: slug,
  };
});
