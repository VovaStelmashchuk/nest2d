import { getDb } from "../db/postgres";
import logger from "../utils/logger";
import { sendNestFinishEmail } from "../features/notification/sendEmail";

export default defineNitroPlugin(async (nitroApp) => {
  logger.info("Nitro plugin start");

  while (true) {
    try {
      const sql = await getDb();
      const [job] = await sql`
        UPDATE nesting_jobs SET email_notify = 'notification_in_progress'
        WHERE id = (
          SELECT id FROM nesting_jobs
          WHERE status = 'done' AND email_notify = 'need_notify'
          ORDER BY id
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;

      if (job) {
        try {
          await sendNestFinishEmail(job);
          await sql`
            UPDATE nesting_jobs SET email_notify = 'notification_sent' WHERE id = ${job.id}
          `;
        } catch (error) {
          await sql`
            UPDATE nesting_jobs SET email_notify = 'error_notify' WHERE id = ${job.id}
          `;
          logger.error('Error in sendNestFinishEmail:', error);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Error in nest-notify plugin:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

});
