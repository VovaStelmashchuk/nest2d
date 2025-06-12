import { getResults } from '~/server/features/results/resultcontroller'

export default defineEventHandler(async (event) => {
    const userId = event.context?.auth?.userId
    if (!userId) {
        setResponseStatus(401)
        return
    }

    const eventStream = createEventStream(event)

    const result = await getResults(userId)
    const items = result.items

    eventStream.push(JSON.stringify({
        type: 'initial',
        data: {
            items: items,
            needNotification: false,
        }
    }))

    let previousResult = result
    const interval = setInterval(async () => {
        const newResult = await getResults(userId)
        if (JSON.stringify(previousResult) !== JSON.stringify(newResult)) {
            eventStream.push(JSON.stringify({
                type: 'update',
                data: {
                    items: newResult.items,
                    needNotification: newResult.items.some(item => {
                        const previousItem = previousResult.items.find(prev => prev.slug === item.slug)
                        return previousItem && previousItem.isInProgress !== item.isInProgress
                    }),
                }
            }))
            previousResult = newResult
        }
    }, 1000)

    const heartbeatInterval = setInterval(async () => {
        eventStream.push(JSON.stringify({
            type: 'heartbeat',
            ts: Date.now()
        }))
    }, 30000)

    eventStream.onClosed(async () => {
        await cleanupEventStream(heartbeatInterval, interval, eventStream)
    })

    return eventStream.send()
});

async function cleanupEventStream(heartbeatInterval, interval, eventStream) {
    clearInterval(heartbeatInterval)
    clearInterval(interval)
    await eventStream.close()
} 