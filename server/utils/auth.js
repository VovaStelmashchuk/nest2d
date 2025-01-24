import { connectDB } from "~/server/db/mongo";
import { compareSync } from "bcrypt";
import { generateRandomString } from "~/server/utils/strings";

export async function addSessionToUser(username, password) {
  const db = await connectDB();
  const user = await db.collection("users").findOne({ username: username });

  if (!user) {
    return {
      error: "Invalid username or password",
    };
  }

  const match = compareSync(password, user.password);

  if (!match) {
    return {
      error: "Invalid username or password",
    };
  }

  const session = generateSession();

  await db.collection("users").updateOne(
    { username: username },
    {
      $push: {
        sessions: session,
      },
    }
  );

  return session;
}

export function generateSession() {
  const sessionId = generateRandomString(64);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  return {
    sessionId: sessionId,
    expiresAt: expiresAt,
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
