import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const userId = event.context?.auth?.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

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

  const parts = file.polygonParts || [];

  const uiParts = parts.map((part) => ({
    width: Math.round(part.width * 10) / 10,
    height: Math.round(part.height * 10) / 10,
  }));

  return {
    slug: file.slug,
    name: file.name,
    processingStatus: status,
    parts: uiParts,
  };
};
