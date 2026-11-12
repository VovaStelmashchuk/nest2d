import { getDb } from "~/server/db/postgres";
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
  if (!sessionId) {
    return;
  }
  const sql = await getDb();
  await sql`DELETE FROM sessions WHERE session_id = ${sessionId}`;
}

/**
 * @returns {Promise<{id: string, isAdmin: boolean}|null>}
 */
export async function getUserBySessionId(sessionId) {
  if (!sessionId) {
    return null;
  }
  const sql = await getDb();
  const [user] = await sql`
    UPDATE users SET last_active_at = now()
    FROM sessions
    WHERE sessions.user_id = users.id
      AND sessions.session_id = ${sessionId}
      AND sessions.expires_at > now()
    RETURNING users.id, users.is_admin
  `;
  return user || null;
}
