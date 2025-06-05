import { connectDB } from '~/server/db/mongo'
import { generateSession } from './auth'
import { sendWelcomeMessage } from '~/server/features/support/welcomemessage'
import { downloadAndStoreAvatar } from './avatar'
import { sendMessage } from './discord'

export async function createOrUpdateUser({
    provider,
    providerId,
    email,
    name,
    avatarUrl,
}) {
    if (!provider || !providerId || !email || !name) {
        throw new Error('Missing required user data: provider and providerId are required')
    }

    const session = generateSession()
    const db = await connectDB()

    const avatarKey = await downloadAndStoreAvatar(providerId, avatarUrl)

    const updateData = {
        $set: {
            provider,
            email,
            name,
            avatarFileName: avatarKey,
        },
        $setOnInsert: {
            createdAt: new Date(),
            balance: 10
        },
        $push: {
            sessions: session
        }
    }

    const isUserExists = await db.collection('users').findOne({ id: `${provider}:${providerId}` })

    await db.collection('users').updateOne(
        { id: `${provider}:${providerId}` },
        updateData,
        { upsert: true }
    )

    if (!isUserExists) {
        try {
            await sendWelcomeMessage(`${provider}:${providerId}`)
            await sendMessage('1380126903528067184', `New user registered, email: ${email}, name: ${name}`)
        } catch (err) {
            console.error(err)
        }
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