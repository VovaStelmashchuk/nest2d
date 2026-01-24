import { connectDB, getAvatarBucket } from "../db/mongo";
import logger from "../utils/logger";

export default defineNitroPlugin(async (_) => {
  logger.info("Avatar sync plugin start");
  const db = await connectDB();
  const avatarBucket = await getAvatarBucket();

  while (true) {
    const userToSync = await db
      .collection("users")
      .findOne({ avatarSource: "origin" });

    if (userToSync) {
      await syncAvatars(db, avatarBucket, userToSync);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
});

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').GridFSBucket} avatarBucket
 * @param {import('mongodb').Document} user
 */
async function syncAvatars(db, avatarBucket, user) {
  logger.info("Syncing avatar for user", user.id);
  try {
    const response = await $fetch(new URL(user.avatarUrl), {
      responseType: "arrayBuffer",
    });

    const buffer = Buffer.from(response);

    const avatarKey = `avatar-${user.id}.jpg`;

    const oldAvatarFiles = await avatarBucket
      .find({ filename: avatarKey })
      .toArray();

    for (const oldAvatarFile of oldAvatarFiles) {
      avatarBucket.delete(oldAvatarFile._id);
    }

    await new Promise((resolve, reject) => {
      const uploadStream = avatarBucket.openUploadStream(avatarKey);
      uploadStream.write(buffer);
      uploadStream.end();

      uploadStream.on("finish", async () => {
        console.log(`Avatar saved for user ${user.id}`);

        await db.collection("users").updateOne(
          { id: user.id },
          {
            $set: {
              avatarSource: "mongo",
              avatarFileName: avatarKey,
            },
            $unset: {
              avatarSyncError: "",
              avatarUrl: "",
            },
          }
        );

        resolve();
      });

      uploadStream.on("error", (err) => {
        logger.error("Error uploading avatar:", err);
        reject(err);
      });
    });
  } catch (error) {
    logger.error("Failed to sync avatar for user", user.id, error);

    await db
      .collection("users")
      .updateOne({ id: user.id }, { $set: { avatarSyncError: error.message } });
  }
}
