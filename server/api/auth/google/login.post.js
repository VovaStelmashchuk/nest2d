import { connectDB } from "~/server/db/mongo";
import { generateSession } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const { googleAccessToken } = await readBody(event);

  const url = new URL("https://www.googleapis.com/oauth2/v3/userinfo");
  url.searchParams.append("access_token", googleAccessToken);

  const data = await $fetch(url);

  const { sub, picture, email, name } = data;

  if (!sub || !email || !picture) {
    setResponseStatus(event, 401);
    return {
      error: "Invalid access token",
      isSub: !!sub,
      isEmail: !!email,
      isAvatar: !!picture,
    };
  }

  const session = generateSession();
  const db = await connectDB();

  await db.collection("users").updateOne(
    { id: `google:${sub}` },
    {
      $set: {
        email: email,
        name: name,
        avatarUrl: picture,
        avatarSource: "origin",
        provider: "google",
        google: {
          sub: sub,
        },
      },
      $push: {
        sessions: session,
      },
    },
    { upsert: true }
  );

  setCookie(event, "sessionId", session.sessionId, {
    expires: new Date(session.expiresAt),
  });

  return {
    ok: true,
  };
});
