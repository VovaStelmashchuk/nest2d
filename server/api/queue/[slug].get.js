import { db } from "~/server/db/mongo";
import { ERROR_NO_SOLUTION_FOUND } from "~~/server/core/constants";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }
  const slug = getRouterParam(event, "slug");

  const queueItem = await db.collection("nest_request").findOne(
    { slug: slug, ownerId: userId },
    {
      projection: {
        slug: 1,
        projectSlug: 1,
        files: 1,
        status: 1,
        params: 1,
        placed: 1,
        requested: 1,
        usage: 1,
        svg: 1,
        result: 1,
      },
    }
  );

  const project = await db.collection("projects").findOne(
    { slug: queueItem.projectSlug },
    {
      projection: {
        name: 1,
        slug: 1,
        "dxf.slug": 1,
        "dxf.name": 1,
        "dxf.svg": 1,
      },
    }
  );

  const nestedFiles = queueItem.files.map((file) => {
    const count = file.count;
    const fileSlug = file.slug;

    const dxfFile = project.dxf.find((dxf) => dxf.slug === fileSlug);
    const fileSvg = dxfFile.svg;

    return {
      slug: fileSlug,
      count: count,
      fileName: dxfFile.name,
      svg: fileSvg,
    };
  });

  let status = queueItem.status;
  let error = undefined;
  if (queueItem.result?.error == ERROR_NO_SOLUTION_FOUND) {
    status = "fail";
    error = {
      message: "No solution found try to increase plate size",
    };
  }

  return {
    slug: queueItem.slug,
    projectSlug: project.slug,
    projectName: project.name,
    status: status,
    error: error,
    nestedFiles: nestedFiles,
    resultSvg: queueItem?.svg?.svg,
    dxfResult: queueItem?.dxfResult,
    params: {
      width: queueItem.params.width,
      height: queueItem.params.height,
      tolerance: queueItem.params.tolerance,
      space: queueItem.params.space,
    },
    placedItemCount: queueItem.placed,
    requestedItemCount: queueItem.requested,
    usage: queueItem.usage,
  };
});
