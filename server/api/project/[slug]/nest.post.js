import { defineEventHandler, readBody } from "h3";
import { nest } from "~~/server/core/nest";

import { connectDB } from "~~/server/db/mongo";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const body = await readBody(event);
  const { files, params } = body;

  const nestResultId = await nest(files, params, slug);

  const db = await connectDB();

  const nestResult = await db
    .collection("nest_request")
    .findOne({ _id: nestResultId });

  if (nestResult.isFail === true) {
    throw creaError({
      status: 400,
      message: "Error during nesting, cannot placed all item into bin",
    });
  }

  let message = "All items placed";
  if (!nestResult.isAllItemsPlaced) {
    message = "Not all items placed";
  }

  return {
    message: message,
    usage: nestResult.usage,
  };
});
