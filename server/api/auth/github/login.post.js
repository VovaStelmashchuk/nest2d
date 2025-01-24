import { db } from "~/server/db/mongo";
import { generateSession } from "~~/server/utils/auth";
import { fetchImageAsBase64 } from "~~/server/utils/image";
import { getConfig } from "~/server/utils/config";

export default defineEventHandler(async (event) => {
  const { githubCode } = await readBody(event);

  const accessToken = await getGithubAccessToken(githubCode);

  const data = await $fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { id, avatar_url, email, name } = data;

  console.log("id", id, "avatar_url", avatar_url, "email", email, "name", name);

  const avatarBase64 = await fetchImageAsBase64(avatar_url);

  if (!id || !email || !avatarBase64) {
    setResponseStatus(event, 401);
    return {
      error: "Invalid access token",
      isId: !!id,
      isEmail: !!email,
      isAvatar: !!avatarBase64,
    };
  }
  const session = generateSession();

  await db.collection("users").updateOne(
    { id: `github:${id}` },
    {
      $set: {
        email: email,
        name: name,
        avatar: avatarBase64,
        provider: "github",
        github: {
          id: id,
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

async function getGithubAccessToken(githubCode) {
  const githubConfig = getConfig().github;

  const url = new URL("https://github.com/login/oauth/access_token");
  url.searchParams.append("client_id", githubConfig.clientId);
  url.searchParams.append("client_secret", githubConfig.clientSecret);
  url.searchParams.append("code", githubCode);

  const data = await $fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  return data["access_token"];
}
