import { connectDB, getAvatarBucket } from "../db/mongo";

export default defineNitroPlugin(async (_) => {
  console.log("Avatar sync plugin start");
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
  console.log("Syncing avatar for user", user.id);
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
        console.error("Error uploading avatar:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Failed to sync avatar for user", user.id, error);

    await db
      .collection("users")
      .updateOne({ id: user.id }, { $set: { avatarSyncError: error.message } });
  }
}
