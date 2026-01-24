import { connectDB } from "../db/mongo";
import logger from "../utils/logger";
import { sendNestFinishEmail } from "../features/notification/sendEmail";

export default defineNitroPlugin(async (nitroApp) => {
  logger.info("Nitro plugin start");
  const db = await connectDB();

  while (true) {
    try {
      const result = await db.collection('nesting_jobs').findOneAndUpdate(
        {
          status: 'done',
          emailNotify: 'need_notify',
        }, {
        $set: {
          emailNotify: 'notification_in_progress',
        }
      }, {
        returnDocument: 'after',
      })

      if (result) {
        try {
          await sendNestFinishEmail(result);
          await db.collection('nesting_jobs').updateOne(
            { _id: result._id },
            { $set: { emailNotify: 'notification_sent' } }
          );
        } catch (error) {
          await db.collection('nesting_jobs').updateOne(
            { _id: result._id },
            { $set: { emailNotify: 'error_notify' } }
          );
          logger.error('Error in sendNestFinishEmail:', error);
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Error in nest-notify plugin:', error);
    }
  }

});
