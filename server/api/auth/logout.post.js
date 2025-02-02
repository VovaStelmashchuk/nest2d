import { removeSessionFromUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const cookie = parseCookies(event);
  const sessionId = cookie.sessionId;
  removeSessionFromUser(sessionId);

  setCookie(event, "sessionId", "", {
    expires: new Date(0),
  });

  setHeader(
    event,
    "Clear-Site-Data",
    '"cache", "cookies", "storage", "executionContexts"'
  );
  return {};
});
