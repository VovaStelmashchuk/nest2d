import { getDb } from '~~/server/db/postgres'

/**
 * Support messages of a user, oldest first, optionally only those after a
 * given message id.
 * @param {string} userId
 * @param {string|null} [afterId]
 * @returns {Promise<{id: string, message: string, sender: string, timestamp: Date}[]>}
 */
export async function getMessages(userId, afterId = null) {
    const sql = await getDb()
    return await sql`
        SELECT id, message, sender, created_at AS timestamp
        FROM support_messages
        WHERE user_id = ${userId}
          ${afterId ? sql`AND id > ${afterId}` : sql``}
        ORDER BY id
    `
}

/**
 * @param {string} userId
 * @param {string} sender
 * @param {string} message
 */
export async function addMessage(userId, sender, message) {
    const sql = await getDb()
    const [record] = await sql`
        INSERT INTO support_messages (user_id, sender, message)
        VALUES (${userId}, ${sender}, ${message})
        RETURNING id, message, sender, created_at AS timestamp
    `
    return record
}

/**
 * Streams a user's support messages over SSE: the full history first, then
 * new messages as they arrive.
 * @param {import('h3').H3Event} event
 * @param {string} userId
 */
export async function streamMessages(event, userId) {
    const eventStream = createEventStream(event)

    const messages = await getMessages(userId)

    let lastId = null
    if (messages.length > 0) {
        eventStream.push(
            JSON.stringify({
                type: 'initial',
                data: messages
            })
        )
        lastId = messages[messages.length - 1].id
    }
    const interval = setInterval(async () => {
        try {
            const newMessages = await getMessages(userId, lastId)
            if (newMessages.length > 0) {
                lastId = newMessages[newMessages.length - 1].id
                await eventStream.push(
                    JSON.stringify({
                        type: 'newMessages',
                        data: newMessages
                    })
                )
            }
        } catch (error) {
            console.error('Error checking for new messages:', error)
        }
    }, 1000)

    const heartbeatInterval = setInterval(async () => {
        await eventStream.push(
            JSON.stringify({
                type: 'heartbeat',
                ts: Date.now()
            })
        )
    }, 30000)

    eventStream.onClosed(async () => {
        clearInterval(heartbeatInterval)
        clearInterval(interval)
        await eventStream.close()
    })

    return eventStream.send()
}
