import { getDb } from "../db/postgres";
import logger from "../utils/logger";

const interval = 20 * 1000;

/**
 * Returns files to the queue when their worker stopped sending keep-alives
 * (the worker refreshes update_ts every 10 seconds while processing).
 */
export default defineNitroPlugin(async (nitroApp) => {
  logger.info("Start status controller plugin");

  while (true) {
    try {
      await new Promise(resolve => setTimeout(resolve, interval));

      const sql = await getDb();
      const thresholdTime = new Date(Date.now() - interval);

      await sql`
        UPDATE user_dxf_files SET processing_status = 'pending'
        WHERE processing_status = 'processing' AND update_ts <= ${thresholdTime}
      `;
    } catch (error) {
      logger.error('Error in status-control plugin:', error);
    }
  }
});
