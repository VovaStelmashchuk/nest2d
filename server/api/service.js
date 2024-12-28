import { defineEventHandler } from "h3";

export default defineEventHandler(async (_) => {
  const response = {};
  response.version = "0.6.0";
  return response;
});
