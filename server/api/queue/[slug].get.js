import { db } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatusCode(401);
    return;
  }
  const slug = getRouterParam(event, "slug");

  const queueItem = await db.collection("nest_request").findOne({ slug: slug });

  const project = await db
    .collection("projects")
    .findOne({ slug: queueItem.projectSlug });

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

  return {
    slug: queueItem.slug,
    projectSlug: project.slug,
    status: queueItem.status,
    nestedFiles: nestedFiles,
    resultSvg: queueItem?.svg?.svg,
    params: {
      width: queueItem.params.width,
      height: queueItem.params.height,
      tolerance: queueItem.params.tolerance,
    },
    usage: queueItem.usage,
  };
});
