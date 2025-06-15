export default defineEventHandler(async (_) => {
  return {
    url: await buildGoogleAuthLink(),
  };
});

async function buildGoogleAuthLink() {
  const baseUrl = useRuntimeConfig().public.baseUrl;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.append("client_id", useRuntimeConfig().public.googleClientId);
  url.searchParams.append("redirect_uri", `${baseUrl}/auth/google/callback`);
  url.searchParams.append("response_type", "token");
  url.searchParams.append("scope", "email profile");

  return url.toString();
}
