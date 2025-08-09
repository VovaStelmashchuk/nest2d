import { connectDB } from '~~/server/db/mongo'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    const isAdmin = event.context?.auth?.isAdmin
    if (!userId || !isAdmin) {
        setResponseStatus(401)
        return
    }

    const eventStream = createEventStream(event)

    const db = await connectDB()

    const customerId = event.context.params.user_id

    const messages = await db
        .collection('supportMessages')
        .find({ userId: customerId })
        .sort({ timestamp: 1 })
        .project({ message: 1, sender: 1, timestamp: 1, _id: 1 })
        .toArray()

    let lastTimestamp = new Date(0)
    if (messages.length > 0) {
        eventStream.push(
            JSON.stringify({
                type: 'initial',
                data: messages
            })
        )
        lastTimestamp = messages[messages.length - 1].timestamp
    }
    const interval = setInterval(async () => {
        const newMessages = await db
            .collection('supportMessages')
            .find({
                userId: customerId,
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
})
