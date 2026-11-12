import { getDb } from '~/server/db/postgres'
import { generateSession } from './auth'
import { sendWelcomeMessage } from '~/server/features/support/welcomemessage'
import { downloadAndStoreAvatar } from './avatar'
import logger from './logger'

export async function createOrUpdateUser({
    sessionId,
    providerId,
    email,
    name,
    avatarUrl,
}) {
    if (!providerId || !email || !name) {
        logger.error('Missing required user data', {
            providerId,
            email,
            name
        })
        throw new Error('Missing required user data')
    }

    const session = generateSession()
    const sql = await getDb()
    const userId = `google:${providerId}`

    // xmax = 0 only for a freshly inserted row.
    const [{ isNew }] = await sql`
        INSERT INTO users (id, provider, email, name)
        VALUES (${userId}, 'google', ${email}, ${name})
        ON CONFLICT (id) DO UPDATE SET
            provider = EXCLUDED.provider,
            email = EXCLUDED.email,
            name = EXCLUDED.name
        RETURNING (xmax = 0) AS is_new
    `

    await sql`
        INSERT INTO sessions (session_id, user_id, expires_at, created_at)
        VALUES (${session.sessionId}, ${userId}, ${session.expiresAt}, ${session.createdAt})
    `

    try {
        await downloadAndStoreAvatar(userId, avatarUrl)
    } catch (err) {
        logger.warn('Failed to store avatar', { userId, err })
    }

    if (isNew) {
        try {
            await sendWelcomeMessage(userId)
        } catch (err) {
            logger.warn('Error sending welcome message', err)
        }
    }

    if (sessionId) {
        await sql`
            UPDATE tracking SET user_id = ${userId}
            WHERE session_key = ${sessionId} AND user_id IS NULL
        `
    }

    return session
}

/**
 * Sets the session cookie in the response
 * @param {Object} event - The H3 event object
 * @param {Object} session - The session object containing sessionId and expiresAt
 */
export function setSessionCookie(event, session) {
    setCookie(event, 'sessionId', session.sessionId, {
        expires: new Date(session.expiresAt)
    })
}
