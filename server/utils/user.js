import { connectDB } from '~/server/db/mongo'
import { generateSession } from './auth'

export async function createOrUpdateUser({
    provider,
    providerId,
    email,
    name,
    payload,
}) {
    if (!provider || !providerId || !email || !name) {
        throw new Error('Missing required user data: provider and providerId are required')
    }

    const session = generateSession()
    const db = await connectDB()

    const updateData = {
        $set: {
            provider,
            email,
            name,
            payload: payload,
        },
        $setOnInsert: {
            createdAt: new Date()
        },
        $push: {
            sessions: session
        }
    }

    await db.collection('users').updateOne(
        { id: `${provider}:${providerId}` },
        updateData,
        { upsert: true }
    )

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