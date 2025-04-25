import { connectDB } from "~/server/db/mongo";
import { generateRandomString } from "~/server/utils/strings";

export function generateSession() {
  const sessionId = generateRandomString(64);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    sessionId: sessionId,
    expiresAt: expiresAt,
    createdAt: new Date(),
  };
}

export async function removeSessionFromUser(sessionId) {
  const db = await connectDB();
  await db.collection("users").updateOne(
    {
      sessions: {
        $elemMatch: {
          sessionId: sessionId,
        },
      },
    },
    {
      $pull: {
        sessions: {
          sessionId: sessionId,
        },
      },
    }
  );
}

export async function getUserBySessionId(sessionId) {
  const db = await connectDB();
  return await db.collection("users").findOne({
    sessions: {
      $elemMatch: {
        sessionId: sessionId,
        expiresAt: {
          $gt: new Date(),
        },
      },
    },
  });
}
