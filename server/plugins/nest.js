import { connectDB } from "../db/mongo";
import logger from "../utils/logger";

export default defineNitroPlugin(async (nitroApp) => {
  logger.info("Nitro plugin start");
  connectDB();
});
