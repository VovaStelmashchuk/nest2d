import { connectDB, getUserSvgBucket } from "~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;
  if (!userId) {
    setResponseStatus(401);
    return;
  }

  const projectSlug = getRouterParam(event, "slug");
  const fileSlug = getRouterParam(event, "fileslug");

  const db = await connectDB();
  const result = await db.collection("projects").findOne(
    { slug: projectSlug, ownerId: userId },
    {
      projection: {
        slug: 1,
        "dxf.slug": 1,
      },
    }
  );

  //Security check
  const allFiles = result?.dxf || [];
  if (!allFiles.find((file) => file.slug === fileSlug)) {
    setResponseStatus(404);
    return;
  }

  const userSvgBucket = await getUserSvgBucket();

  const readStream = userSvgBucket.openDownloadStreamByName(fileSlug);

  setResponseHeaders(event, {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400", // Cache for 1 day
  });
  return readStream;
});
