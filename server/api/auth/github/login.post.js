import { db } from "~/server/db/mongo";
import { generateSession } from "~~/server/utils/auth";
import { fetchImageAsBase64 } from "~~/server/utils/image";

export default defineEventHandler(async (event) => {
  const { code } = await readBody(event);


});
