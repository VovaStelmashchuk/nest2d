import { getDb } from '~~/server/db/postgres'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const isAdmin = event.context?.auth?.isAdmin
    if (!userId || !isAdmin) {
        setResponseStatus(event, 401)
        return
    }

    const eventStream = createEventStream(event)
    const sql = await getDb()

    // Latest non-welcome message per user, most recent conversation first.
    const getChatList = async () => {
        const rows = await sql`
            SELECT * FROM (
                SELECT DISTINCT ON (m.user_id)
                    m.user_id, m.message AS last_message, m.created_at AS timestamp,
                    u.name AS user_name
                FROM support_messages m
                JOIN users u ON u.id = m.user_id
                WHERE m.sender <> 'welcome'
                ORDER BY m.user_id, m.id DESC
            ) chats
            ORDER BY timestamp DESC
        `
        return rows.map((row) => ({
            userId: row.userId,
            lastMessage: row.lastMessage,
            timestamp: row.timestamp,
            user: { id: row.userId, name: row.userName },
        }))
    }

    // Get initial chat list
    const initialChatList = await getChatList()

    let lastTimestamp = new Date(0)
    if (initialChatList.length > 0) {
        // Find the most recent timestamp from the initial data
        lastTimestamp = Math.max(...initialChatList.map(chat => new Date(chat.timestamp).getTime()))
        lastTimestamp = new Date(lastTimestamp)

        eventStream.push(
            JSON.stringify({
                type: 'initial',
                data: initialChatList
            })
        )
    }

    // Check for updates every second
    const interval = setInterval(async () => {
        try {
            // Get updated chat list
            const updatedChatList = await getChatList()

            // Check if there are any new messages by comparing timestamps
            const hasNewMessages = updatedChatList.some(chat =>
                new Date(chat.timestamp) > lastTimestamp
            )

            if (hasNewMessages) {
                // Update lastTimestamp to the most recent timestamp
                const newLastTimestamp = Math.max(...updatedChatList.map(chat =>
                    new Date(chat.timestamp).getTime()
                ))
                lastTimestamp = new Date(newLastTimestamp)

                await eventStream.push(
                    JSON.stringify({
                        type: 'update',
                        data: updatedChatList
                    })
                )
            }
        } catch (error) {
            console.error('Error checking for updates:', error)
        }
    }, 1000)

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(async () => {
        await eventStream.push(
            JSON.stringify({
                type: 'heartbeat',
                ts: Date.now()
            })
        )
    }, 30000)

    // Clean up intervals when connection closes
    eventStream.onClosed(async () => {
        clearInterval(heartbeatInterval)
        clearInterval(interval)
        await eventStream.close()
    })

    return eventStream.send()
})
