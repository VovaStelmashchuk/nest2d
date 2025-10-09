import { connectDB } from '~/server/db/mongo'
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
    const db = await connectDB()

    const avatarKey = await downloadAndStoreAvatar(providerId, avatarUrl)

    const updateData = {
        $set: {
            provider: 'google',
            email,
            name,
            avatarFileName: avatarKey,
        },
        $setOnInsert: {
            createdAt: new Date(),
            balance: 30,
        },
        $push: {
            sessions: session
        }
    }

    const userId = `google:${providerId}`
    const isUserExists = await db.collection('users').findOne({ id: userId })

    await db.collection('users').updateOne(
        { id: userId },
        updateData,
        { upsert: true }
    )

    if (!isUserExists) {
        try {
            await sendWelcomeMessage(userId)
        } catch (err) {
            logger.warn('Error sending welcome message', err)
        }
    }

    await db.collection('tracking').updateMany(
        { sessionKey: sessionId },
        { $set: { userId: userId } }
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