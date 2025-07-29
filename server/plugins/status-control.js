import { connectDB } from "../db/mongo";
import logger from "../utils/logger";

const interval = 20 * 1000;

export default defineNitroPlugin(async (nitroApp) => {
  logger.info("Start status controller plugin");
  const db = await connectDB();

  while (true) {
    try {
      await new Promise(resolve => setTimeout(resolve, interval));

      const thresholdTime = new Date(Date.now() - interval);

      const updateResult = await db.collection("user_dxf_files").updateMany(
        {
          processingStatus: "processing",
          update_ts: { $lte: thresholdTime }
        },
        {
          $set: { processingStatus: "pending" }
        }
      );
      logger.info("Status controller plugin updated", {
        updateResult
      });
    } catch (error) {
      logger.error('Error in nest-notify plugin:', error);
    }
  }
});
