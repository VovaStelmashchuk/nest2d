import { db } from "~/server/db/mongo";
import { generateSession } from "~~/server/utils/auth";
import { fetchImageAsBase64 } from "~~/server/utils/image";

export default defineEventHandler(async (event) => {
  const { googleAccessToken } = await readBody(event);

  const url = new URL("https://www.googleapis.com/oauth2/v3/userinfo");
  url.searchParams.append("access_token", googleAccessToken);

  const data = await $fetch(url);

  const { sub, picture, email, name } = data;

  const avatarBase64 = await fetchImageAsBase64(picture);

  if (!sub || !email || !avatarBase64) {
    setResponseStatus(event, 401);
    return {
      error: "Invalid access token",
      isSub: !!sub,
      isEmail: !!email,
      isAvatar: !!avatarBase64,
    };
  }

  const session = generateSession();

  await db.collection("users").updateOne(
    { id: `google:${sub}` },
    {
      $set: {
        email: email,
        name: name,
        avatar: avatarBase64,
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
