import { connectDB } from "~~/server/db/mongo";
import { assertStripFeatureEnabled } from "~~/server/utils/featureFlags";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  await assertStripFeatureEnabled(userId);

  const slug = getRouterParam(event, "slug");

  const db = await connectDB();
  const strip = await db.collection("strip_projects").findOne(
    { slug: slug },
    {
      projection: {
        name: 1,
        slug: 1,
        ownerId: 1,
      },
    }
  );

  if (!strip) {
    throw createError({ statusCode: 404, message: "Strip project not found" });
  }

  if (strip.ownerId !== userId) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  const stripFiles = await db
    .collection("strip_user_dxf_files")
    .find({
      stripSlug: slug,
      ownerId: userId,
    })
    .sort({ uploadAt: 1 })
    .toArray();

  return {
    name: strip.name,
    slug: strip.slug,
    files: stripFiles.map((file) => mapFileToUi(file)),
  };
});

const mapFileToUi = (file) => {
  return {
    slug: file.slug,
    name: file.name,
    dxfUrl: `/api/files/strip/dxf/${file.slug}`,
  };
};
