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
  let status;
  if (file.processingStatus === "completed") {
    status = "done";
  } else if (
    file.processingStatus === "processing" ||
    file.processingStatus === "pending"
  ) {
    status = "in-progress";
  } else {
    status = file.processingStatus;
  }

  return {
    slug: file.slug,
    name: file.name,
    dxfUrl: `/api/files/strip/dxf/${file.slug}`,
    minHeight: minRequiredHeight(file),
    processingStatus: status,
  };
};

// Minimum strip height required to nest a file is the tallest of its polygon
// parts, since every part must fit within the strip height.
const minRequiredHeight = (file) => {
  const parts = file.polygonParts || [];
  const heights = parts
    .map((part) => part.height)
    .filter((height) => typeof height === "number");

  if (heights.length === 0) {
    return null;
  }

  return Math.max(...heights);
};
