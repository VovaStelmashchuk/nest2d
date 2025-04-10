import { connectDB } from '~~/server/db/mongo'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(401)
        return
    }

    const eventStream = createEventStream(event)

    const db = await connectDB()

    const messages = await db
        .collection('supportMessages')
        .find({ userId: userId })
        .sort({ timestamp: 1 })
        .project({ message: 1, sender: 1, timestamp: 1, _id: 1 })
        .toArray()

    eventStream.push(
        JSON.stringify({
            type: 'initial',
            data: messages
        })
    )

    let lastTimestamp = messages[messages.length - 1]?.timestamp || 0

    const interval = setInterval(async () => {
        const newMessages = await db
            .collection('supportMessages')
            .find({
                userId: userId,
                sender: 'support',
                timestamp: { $gt: lastTimestamp }
            })
            .sort({ timestamp: 1 })
            .project({ message: 1, sender: 1, timestamp: 1, _id: 1 })
            .toArray()

        if (newMessages.length > 0) {
            lastTimestamp = newMessages[newMessages.length - 1].timestamp
            await eventStream.push(
                JSON.stringify({
                    type: 'newMessages',
                    data: newMessages
                })
            )
        }
    }, 1000)

    const heartbeatInterval = setInterval(async () => {
        await eventStream.push(
            `data: ${JSON.stringify({ type: 'heartbeat', ts: Date.now() })}\n\n`
        )
    }, 30000)

    eventStream.onClosed(async () => {
        clearInterval(heartbeatInterval)
        clearInterval(interval)
        await eventStream.close()
    })

    return eventStream.send()
})
