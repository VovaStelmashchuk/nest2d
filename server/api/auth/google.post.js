import { db } from "~/server/db/mongo";
import { generateSession } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const { googleAccessToken } = await readBody(event);

  const url = new URL("https://www.googleapis.com/oauth2/v3/userinfo");
  url.searchParams.append("access_token", googleAccessToken);

  const data = await $fetch(url);

  const { sub, picture, email, name } = data;

  if (!sub || !email) {
    setResponseStatus(event, 401);
    return {
      status: 400,
      body: {
        error: "Invalid access token",
      },
    };
  }

  const session = generateSession();

  await db.collection("users").updateOne(
    { id: `google:${sub}` },
    {
      $set: {
        email: email,
        name: name,
        avatar: picture,
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
