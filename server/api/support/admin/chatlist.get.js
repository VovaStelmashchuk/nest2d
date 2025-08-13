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

    const pipeline = [
        {
            $match: {
                sender: {
                    $ne: "welcome"
                }
            }
        },
        {
            $sort: {
                userId: 1,
                timestamp: -1
            }
        },
        {
            $group: {
                _id: "$userId",
                userId: {
                    $first: "$userId"
                },
                lastMessage: {
                    $first: "$message"
                },
                timestamp: {
                    $first: "$timestamp"
                }
            }
        },
        {
            $sort: {
                timestamp: -1
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: 'id',
                as: 'user',
            }
        },
        {
            $unwind: {
                path: '$user'
            }
        },
        {
            $project: {
                userId: 1,
                lastMessage: 1,
                timestamp: 1,
                'user.name': 1,
                'user.id': 1,
            }
        }
    ]

    // Get initial chat list
    const initialChatList = await db
        .collection('supportMessages')
        .aggregate(pipeline)
        .toArray()

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
            const updatedChatList = await db
                .collection('supportMessages')
                .aggregate(pipeline)
                .toArray()

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
