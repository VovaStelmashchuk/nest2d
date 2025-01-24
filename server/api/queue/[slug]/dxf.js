import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  const db = await connectDB();

  const nestResult = await db
    .collection("nest_request")
    .findOne({ slug: slug });

  setHeader(event, "Content-Type", "application/octet-stream");
  setHeader(event, "Content-Disposition", `attachment; filename="${slug}.dxf"`);

  return nestResult.dxfResult.buffer;
});
