import { defineEventHandler, readBody } from "h3";
import { parseAndCombine } from "~~/server/core/dxf/parser";

import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const { files, params } = body;

  const db = await connectDB();
  db.collection("nest_request").insertOne({
    slug: slug,
    body: body,
    requestedAt: new Date(),
  });

  const project = await db.collection("projects_v2").findOne({ slug });
  const arrayOfDxfWithCount = files.map((file) => {
    const dxfString = project.dxf.find((d) => d.slug === file.slug).data;
    return {
      polygones: parseAndCombine(dxfString, 0.1).closed,
      count: file.count,
    };
  });

  const jaguarRequest = buildNestJson(arrayOfDxfWithCount);

  return {
    status: 200,
    body: {
      jaguarRequest,
    },
  };
});

function buildNestJson(arrayOfDxfWithCount) {
  const polgyones = arrayOfDxfWithCount.map((dxf) => {
    return dxf.polygones;
  });

  const firstDxf = polgyones[0];
  const firstPolygone = firstDxf[0];

  console.log(firstPolygone);
  return 0;
}
